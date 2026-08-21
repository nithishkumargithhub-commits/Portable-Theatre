from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, desc, asc
from typing import List, Optional
from datetime import datetime, timedelta
import csv
import io

from app.database import get_db
from app.models import User, Party, WatchHistory, AdminAuditLog
from app.schemas import (
    UserResponse, AdminUserResponse, PaginatedUserResponse,
    AdminStatsExtendedResponse, DailyRegistrationData,
    ActivityItemResponse, AdminAuditLogResponse
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def log_admin_action(admin_id: str, action: str, target_id: Optional[str], details: str, db: AsyncSession):
    audit = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        target_id=target_id,
        details=details
    )
    db.add(audit)

@router.get("/stats", response_model=AdminStatsExtendedResponse)
async def get_admin_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)

    total_users_res = await db.execute(select(func.count(User.id)))
    total_users = total_users_res.scalar() or 0

    new_users_7d_res = await db.execute(select(func.count(User.id)).where(User.created_at >= seven_days_ago))
    new_users_7d = new_users_7d_res.scalar() or 0

    active_users_7d_res = await db.execute(select(func.count(User.id)).where(User.last_active_at >= seven_days_ago))
    active_users_7d = active_users_7d_res.scalar() or 0

    total_parties_res = await db.execute(select(func.count(Party.id)))
    total_parties = total_parties_res.scalar() or 0

    active_parties_res = await db.execute(select(func.count(Party.id)).where(Party.status == "active"))
    active_parties = active_parties_res.scalar() or 0

    watch_seconds_res = await db.execute(select(func.sum(WatchHistory.duration_seconds)))
    total_seconds = watch_seconds_res.scalar() or 0
    total_hours = round(total_seconds / 3600.0, 2)

    total_sessions_res = await db.execute(select(func.count(WatchHistory.id)))
    total_sessions = total_sessions_res.scalar() or 0

    admin_users_res = await db.execute(select(func.count(User.id)).where(User.role == "admin"))
    admin_users = admin_users_res.scalar() or 0

    # Daily registration chart for last 7 days
    chart_data = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())
        res = await db.execute(select(func.count(User.id)).where(User.created_at >= day_start, User.created_at <= day_end))
        count = res.scalar() or 0
        chart_data.append(DailyRegistrationData(date=day_date.strftime("%a (%b %d)"), count=count))

    return AdminStatsExtendedResponse(
        total_users=total_users,
        new_users_7d=new_users_7d,
        active_users_7d=active_users_7d,
        total_parties=total_parties,
        active_parties_count=active_parties,
        total_watch_hours=total_hours,
        total_sessions=total_sessions,
        admin_users_count=admin_users,
        registration_chart=chart_data
    )

@router.get("/users", response_model=PaginatedUserResponse)
async def get_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"), # "active", "inactive"
    sort_by: Optional[str] = Query("created_at"), # "created_at", "last_active", "watch_time"
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(User.username.ilike(term), User.email.ilike(term)))

    # Role filter
    if role and role.strip() and role.strip().lower() != "all":
        query = query.where(User.role == role.strip().lower())

    # Status filter
    if status_filter and status_filter.strip() and status_filter.strip().lower() != "all":
        if status_filter.strip().lower() == "active":
            query = query.where(User.is_active == True)
        elif status_filter.strip().lower() == "inactive":
            query = query.where(User.is_active == False)

    # Total count query
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total_users = total_res.scalar() or 0

    # Sorting
    if sort_by == "last_active":
        query = query.order_by(desc(User.last_active_at))
    elif sort_by == "oldest":
        query = query.order_by(asc(User.created_at))
    else:
        query = query.order_by(desc(User.created_at))

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    # Enrich users with party_count and total_watch_seconds
    admin_users_list = []
    for u in users:
        # Parties created count
        p_res = await db.execute(select(func.count(Party.id)).where(Party.host_id == u.id))
        party_cnt = p_res.scalar() or 0

        # Total watch seconds
        w_res = await db.execute(select(func.sum(WatchHistory.duration_seconds)).where(WatchHistory.user_id == u.id))
        watch_sec = w_res.scalar() or 0

        admin_users_list.append(
            AdminUserResponse(
                id=u.id,
                username=u.username,
                email=u.email,
                role=u.role,
                avatar_url=u.avatar_url,
                is_active=u.is_active if u.is_active is not None else True,
                created_at=u.created_at,
                last_active_at=u.last_active_at or u.created_at,
                party_count=party_cnt,
                total_watch_seconds=watch_sec
            )
        )

    total_pages = max(1, (total_users + page_size - 1) // page_size)

    return PaginatedUserResponse(
        users=admin_users_list,
        total_users=total_users,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/users/export")
async def export_users_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(desc(User.created_at)))
    users = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "User ID", "Username", "Email", "Role", "Status",
        "Created At", "Last Active At", "Parties Created", "Total Watch Time (Hours)"
    ])

    for u in users:
        p_res = await db.execute(select(func.count(Party.id)).where(Party.host_id == u.id))
        party_cnt = p_res.scalar() or 0

        w_res = await db.execute(select(func.sum(WatchHistory.duration_seconds)).where(WatchHistory.user_id == u.id))
        watch_sec = w_res.scalar() or 0
        watch_hours = round(watch_sec / 3600.0, 2)

        writer.writerow([
            u.id,
            u.username,
            u.email,
            u.role,
            "Active" if (u.is_active if u.is_active is not None else True) else "Inactive",
            u.created_at.isoformat() if u.created_at else "",
            (u.last_active_at or u.created_at).isoformat() if u.last_active_at or u.created_at else "",
            party_cnt,
            watch_hours
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=portable_theatre_users_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.post("/users/{user_id}/role", response_model=AdminUserResponse)
async def update_user_role(
    user_id: str,
    role: str = Query(...),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'user' or 'admin'")

    if user_id == admin.id and role == "user":
        # Check if there are other admins
        admin_cnt_res = await db.execute(select(func.count(User.id)).where(User.role == "admin"))
        if (admin_cnt_res.scalar() or 0) <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last remaining administrator account.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    user.role = role
    await log_admin_action(admin.id, "updated_user_role", user.id, f"Changed role of '{user.username}' from {old_role} to {role}", db)
    await db.commit()
    await db.refresh(user)

    p_res = await db.execute(select(func.count(Party.id)).where(Party.host_id == user.id))
    party_cnt = p_res.scalar() or 0
    w_res = await db.execute(select(func.sum(WatchHistory.duration_seconds)).where(WatchHistory.user_id == user.id))
    watch_sec = w_res.scalar() or 0

    return AdminUserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        avatar_url=user.avatar_url,
        is_active=user.is_active if user.is_active is not None else True,
        created_at=user.created_at,
        last_active_at=user.last_active_at or user.created_at,
        party_count=party_cnt,
        total_watch_seconds=watch_sec
    )

@router.put("/users/{user_id}/status", response_model=AdminUserResponse)
async def update_user_status(
    user_id: str,
    is_active: bool = Query(...),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id and not is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    status_str = "activated" if is_active else "deactivated"
    await log_admin_action(admin.id, f"{status_str}_user", user.id, f"Set active status of '{user.username}' to {is_active}", db)
    await db.commit()
    await db.refresh(user)

    p_res = await db.execute(select(func.count(Party.id)).where(Party.host_id == user.id))
    party_cnt = p_res.scalar() or 0
    w_res = await db.execute(select(func.sum(WatchHistory.duration_seconds)).where(WatchHistory.user_id == user.id))
    watch_sec = w_res.scalar() or 0

    return AdminUserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at,
        last_active_at=user.last_active_at or user.created_at,
        party_count=party_cnt,
        total_watch_seconds=watch_sec
    )

@router.get("/activity", response_model=List[ActivityItemResponse])
async def get_recent_activity(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    activities = []

    # 1. Recent registrations
    reg_res = await db.execute(select(User).order_by(desc(User.created_at)).limit(10))
    for u in reg_res.scalars().all():
        activities.append(ActivityItemResponse(
            id=f"reg_{u.id}",
            user_id=u.id,
            username=u.username,
            avatar_url=u.avatar_url,
            action="registered",
            details=f"Account created as {u.role.upper()}",
            timestamp=u.created_at
        ))

    # 2. Recent parties created
    party_res = await db.execute(select(Party).order_by(desc(Party.created_at)).limit(10))
    for p in party_res.scalars().all():
        host_res = await db.execute(select(User).where(User.id == p.host_id))
        host = host_res.scalars().first()
        activities.append(ActivityItemResponse(
            id=f"party_{p.id}",
            user_id=p.host_id,
            username=host.username if host else "Host",
            avatar_url=host.avatar_url if host else None,
            action="created_party",
            details=f"Hosted party '{p.title}' (Code: {p.invite_code})",
            timestamp=p.created_at
        ))

    # 3. Recent watch sessions
    history_res = await db.execute(select(WatchHistory).order_by(desc(WatchHistory.joined_at)).limit(10))
    for wh in history_res.scalars().all():
        u_res = await db.execute(select(User).where(User.id == wh.user_id))
        u = u_res.scalars().first()
        mins = max(1, wh.duration_seconds // 60)
        activities.append(ActivityItemResponse(
            id=f"session_{wh.id}",
            user_id=wh.user_id,
            username=u.username if u else "Viewer",
            avatar_url=u.avatar_url if u else None,
            action="watched_session",
            details=f"Watched '{wh.party_title}' for {mins} mins",
            timestamp=wh.joined_at
        ))

    # Sort all combined activities descending by timestamp
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:20]

@router.delete("/parties/{party_id}")
async def admin_delete_party(
    party_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Party).where(Party.id == party_id))
    party = result.scalars().first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    title = party.title
    await log_admin_action(admin.id, "terminated_party", party_id, f"Terminated party room '{title}'", db)
    await db.delete(party)
    await db.commit()
    return {"message": f"Party '{title}' terminated by admin"}
