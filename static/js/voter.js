let voterToken = "";
let biometricVerified = false;

function showAlert(message, type = "info") {
  const box = document.getElementById("voterAlert");
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.classList.remove("d-none");
}

async function api(url, options = {}) {
  const headers = options.headers || {};
  if (voterToken) headers.Authorization = `Bearer ${voterToken}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

document.getElementById("voterLogin").onclick = async () => {
  try {
    const student_id = document.getElementById("studentId").value;
    const data = await api("/voter/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id }),
    });
    voterToken = data.token;
    biometricVerified = false;
    showAlert(`Welcome ${data.voter.name}. Please verify biometric.`, "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("verifyBiometric").onclick = async () => {
  try {
    const form = new FormData();
    form.append("biometric", document.getElementById("biometricFile").files[0]);
    await api("/voter/verify-biometric", { method: "POST", body: form });
    biometricVerified = true;
    showAlert("Biometric verified successfully", "success");
  } catch (e) {
    biometricVerified = false;
    showAlert(e.message, "danger");
  }
};

document.getElementById("loadElections").onclick = async () => {
  try {
    const elections = await api("/voter/active-elections");
    const select = document.getElementById("electionSelect");
    select.innerHTML = elections.map(e => `<option value="${e.id}">${e.name} (${e.club_name})</option>`).join("");
    showAlert("Active elections loaded", "info");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("loadCandidates").onclick = async () => {
  try {
    if (!biometricVerified) throw new Error("Verify biometric before viewing/casting vote.");

    const electionId = Number(document.getElementById("electionSelect").value);
    const candidates = await api(`/voter/elections/${electionId}/candidates`);
    const container = document.getElementById("candidatesContainer");
    container.innerHTML = candidates.map(c => `
      <div class="col-md-6">
        <div class="card"><div class="card-body">
          <h5>${c.name}</h5>
          <p class="text-muted mb-2">${c.position}</p>
          <button class="btn btn-primary" onclick="castVote(${electionId}, ${c.id})">Vote</button>
        </div></div>
      </div>
    `).join("");
    showAlert("Candidates loaded", "info");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

window.castVote = async (election_id, candidate_id) => {
  try {
    if (!biometricVerified) throw new Error("Biometric verification required");
    await api("/voter/cast-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_id, candidate_id }),
    });
    showAlert("Vote submitted successfully. Thank you for voting!", "success");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};

document.getElementById("voterLogout").onclick = async () => {
  try {
    await api("/voter/logout", { method: "POST" });
    voterToken = "";
    biometricVerified = false;
    showAlert("Logged out", "secondary");
  } catch (e) {
    showAlert(e.message, "danger");
  }
};
