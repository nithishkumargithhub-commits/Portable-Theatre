
function parseApiError(errorData, fallbackMsg) {
  if (!errorData) return fallbackMsg;
  if (typeof errorData.detail === 'string') return errorData.detail;
  if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
    const item = errorData.detail[0];
    if (typeof item === 'string') return item;
    if (item && item.msg) return item.msg;
  }
  if (errorData.message) return errorData.message;
  return fallbackMsg;
}

const API_BASE = "/api";

export async function loginGuest(username) {
  try {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API offline, using local session mode", err);
  }

  // Fallback local guest session
  const fakeId = "user_" + Math.random().toString(36).substr(2, 9);
  const guestUser = {
    id: fakeId,
    username: username || `Guest_${Math.floor(Math.random() * 1000)}`,
    email: `${fakeId}@guest.local`,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username || fakeId}`,
    created_at: new Date().toISOString(),
  };

  return {
    access_token: "local_mock_token_" + fakeId,
    user: guestUser,
  };
}

export async function registerApi(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(errorData.detail || "Registration failed");
  }
  return await res.json();
}

export async function loginApi(username_or_email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username_or_email, password })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(parseApiError(errorData, "Invalid credentials"));
  }
  return await res.json();
}

export async function demoAdminApi() {
  const res = await fetch(`${API_BASE}/auth/demo-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    throw new Error("Demo admin provisioning failed");
  }
  return await res.json();
}

export async function fetchWatchHistoryApi(token) {
  try {
    const res = await fetch(`${API_BASE}/analytics/history`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Watch history fetch error", e);
  }
  return [];
}

export async function logWatchSessionApi(sessionData, token) {
  try {
    const res = await fetch(`${API_BASE}/analytics/watch-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(sessionData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Log watch session error", e);
  }
}

export async function fetchAdminStatsApi(token) {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return await res.json();
}

export async function fetchAdminUsersApi(token) {
  const res = await fetch(`${API_BASE}/admin/users?page=1&page_size=100`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch user list");
  const data = await res.json();
  return data.users || data;
}

export async function fetchPaginatedAdminUsersApi(token, { page = 1, pageSize = 10, search = "", role = "all", status = "all", sortBy = "created_at" } = {}) {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    search: search || "",
    role: role || "all",
    status: status || "all",
    sort_by: sortBy || "created_at"
  }).toString();

  const res = await fetch(`${API_BASE}/admin/users?${query}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch paginated user list");
  return await res.json();
}

export async function updateUserRoleApi(userId, role, token) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role?role=${role}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Role update failed" }));
    throw new Error(err.detail || "Failed to update user role");
  }
  return await res.json();
}

export async function updateUserStatusApi(userId, isActive, token) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/status?is_active=${isActive}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Status update failed" }));
    throw new Error(err.detail || "Failed to update user status");
  }
  return await res.json();
}

export async function fetchAdminActivityApi(token) {
  try {
    const res = await fetch(`${API_BASE}/admin/activity`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Failed to fetch admin activity", e);
  }
  return [];
}

export async function exportAdminUsersCsvApi(token) {
  const res = await fetch(`${API_BASE}/admin/users/export`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to export users CSV");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portable_theatre_users_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function adminDeletePartyApi(partyId, token) {
  const res = await fetch(`${API_BASE}/admin/parties/${partyId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to terminate party room");
  return await res.json();
}

export async function fetchParties() {
  try {
    const res = await fetch(`${API_BASE}/parties`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API offline, using mock parties", err);
  }

  // Fallback demo rooms
  return [
    {
      id: "room_cyberpunk",
      host_id: "user_alex",
      title: "🍿 Sci-Fi Movie Night (Big Buck Bunny 4K)",
      description: "Join us for an ultra-HD movie watch party! Synchronized 4K HLS stream.",
      invite_code: "CYBER88",
      status: "active",
      max_participants: 50,
      is_public: true,
      created_at: new Date().toISOString(),
      active_participants_count: 5,
      video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      video_title: "Big Buck Bunny 4K (HLS)",
    },
    {
      id: "room_anime",
      host_id: "user_sarah",
      title: "⚡ Anime Trailer Watch Party",
      description: "Chill vibes, anime trailers and direct video stream.",
      invite_code: "ANIME99",
      status: "active",
      max_participants: 25,
      is_public: true,
      created_at: new Date().toISOString(),
      active_participants_count: 3,
      video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      video_title: "Tears of Steel (MP4)",
    },
    {
      id: "room_nature",
      host_id: "user_david",
      title: "🌊 Sintel Short Film Screening",
      description: "Open source cinema party with live chat & reactions.",
      invite_code: "NATURE77",
      status: "active",
      max_participants: 100,
      is_public: true,
      created_at: new Date().toISOString(),
      active_participants_count: 8,
      video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      video_title: "Sintel Cinema Stream (MP4)",
    }
  ];
}

export async function createPartyApi(partyData, token) {
  try {
    const res = await fetch(`${API_BASE}/parties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(partyData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API offline, creating party locally", err);
  }

  const roomId = "room_" + Math.random().toString(36).substr(2, 9);
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  return {
    id: roomId,
    host_id: "current_user",
    title: partyData.title,
    description: partyData.description,
    invite_code: code,
    status: "active",
    max_participants: partyData.max_participants || 100,
    is_public: partyData.is_public !== false,
    created_at: new Date().toISOString(),
    active_participants_count: 1,
    video_url: partyData.video_url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    video_title: partyData.video_title || "Big Buck Bunny"
  };
}
