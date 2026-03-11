let adminToken = "";

function showAlert(message, type = "info") {
  const box = document.getElementById("adminAlert");
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.classList.remove("d-none");
}

async function api(url, options = {}) {
  const headers = options.headers || {};
  if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

document.getElementById("adminLogin").onclick = async () => {
  try {
    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;
    const data = await api("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    adminToken = data.token;
    showAlert("Admin login successful", "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("createElectionBtn").onclick = async () => {
  try {
    const payload = {
      name: document.getElementById("electionName").value,
      club_name: document.getElementById("clubName").value,
      date: document.getElementById("electionDate").value,
    };
    const data = await api("/admin/create-election", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showAlert(`Election created with ID ${data.election_id}`, "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("addCandidateBtn").onclick = async () => {
  try {
    const payload = {
      election_id: Number(document.getElementById("candidateElectionId").value),
      name: document.getElementById("candidateName").value,
      position: document.getElementById("candidatePosition").value,
      photo_url: document.getElementById("candidatePhoto").value,
    };
    const data = await api("/admin/add-candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showAlert(`Candidate added with ID ${data.candidate_id}`, "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("registerVoterBtn").onclick = async () => {
  try {
    const form = new FormData();
    form.append("student_id", document.getElementById("voterStudentId").value);
    form.append("name", document.getElementById("voterName").value);
    form.append("department", document.getElementById("voterDepartment").value);
    form.append("biometric", document.getElementById("voterBiometric").files[0]);

    const data = await api("/admin/register-voter", {
      method: "POST",
      body: form,
    });
    showAlert(`Voter registered with ID ${data.voter_id}`, "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("toggleVotingBtn").onclick = async () => {
  try {
    const electionId = Number(document.getElementById("toggleElectionId").value);
    const data = await api(`/admin/elections/${electionId}/toggle`, { method: "PATCH" });
    showAlert(`Voting status: ${data.is_active ? "ENABLED" : "DISABLED"}`, "warning");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("publishResultsBtn").onclick = async () => {
  try {
    const electionId = Number(document.getElementById("toggleElectionId").value);
    await api(`/admin/declare-results/${electionId}`, { method: "PATCH" });
    showAlert("Results published", "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("loadStatsBtn").onclick = async () => {
  try {
    const electionId = Number(document.getElementById("statsElectionId").value);
    const data = await api(`/admin/stats/${electionId}`);
    document.getElementById("statsOutput").textContent = JSON.stringify(data, null, 2);
    showAlert("Stats loaded", "info");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("adminLogout").onclick = async () => {
  try {
    await api("/admin/logout", { method: "POST" });
    adminToken = "";
    showAlert("Logged out", "secondary");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};
