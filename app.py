import os
import hmac
import hashlib
from datetime import datetime, timedelta

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", "sqlite:///voting.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

jwt = JWTManager(app)
db = SQLAlchemy(app)


class Admin(db.Model):
    __tablename__ = "admins"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)


class Voter(db.Model):
    __tablename__ = "voters"
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(30), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    department = db.Column(db.String(120), nullable=False)
    biometric_hash = db.Column(db.String(128), nullable=False)


class Election(db.Model):
    __tablename__ = "elections"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    election_date = db.Column(db.Date, nullable=False)
    club_name = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    is_published = db.Column(db.Boolean, default=False, nullable=False)


class Candidate(db.Model):
    __tablename__ = "candidates"
    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey("elections.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    position = db.Column(db.String(120), nullable=False)
    photo_url = db.Column(db.String(255), nullable=True)

    election = db.relationship("Election", backref=db.backref("candidates", lazy=True))


class Vote(db.Model):
    __tablename__ = "votes"
    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey("elections.id"), nullable=False)
    voter_id = db.Column(db.Integer, db.ForeignKey("voters.id"), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey("candidates.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("election_id", "voter_id", name="uq_vote_once"),)


class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


@jwt.token_in_blocklist_loader
def is_token_revoked(_jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar() is not None


def biometric_digest(file_storage):
    data = file_storage.read()
    file_storage.stream.seek(0)
    pepper = os.getenv("BIOMETRIC_PEPPER", "demo-pepper")
    return hashlib.sha256(data + pepper.encode("utf-8")).hexdigest()


def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)

    wrapper.__name__ = fn.__name__
    return wrapper


def voter_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "voter":
            return jsonify({"error": "Voter access required"}), 403
        return fn(*args, **kwargs)

    wrapper.__name__ = fn.__name__
    return wrapper


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/admin")
def admin_page():
    return render_template("admin.html")


@app.route("/voter")
def voter_page():
    return render_template("voter.html")


@app.route("/admin/login", methods=["POST"])
def admin_login():
    payload = request.get_json() or {}
    username = payload.get("username", "").strip()
    password = payload.get("password", "")

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not check_password_hash(admin.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(admin.id), additional_claims={"role": "admin"}, expires_delta=timedelta(hours=3))
    return jsonify({"token": token, "admin": {"id": admin.id, "username": admin.username}})


@app.route("/admin/create-election", methods=["POST"])
@admin_required
def create_election():
    payload = request.get_json() or {}
    name = payload.get("name", "").strip()
    club_name = payload.get("club_name", "").strip()
    date_input = payload.get("date", "").strip()

    if not all([name, club_name, date_input]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        election_date = datetime.strptime(date_input, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    election = Election(name=name, club_name=club_name, election_date=election_date)
    db.session.add(election)
    db.session.commit()

    return jsonify({"message": "Election created", "election_id": election.id}), 201


@app.route("/admin/add-candidate", methods=["POST"])
@admin_required
def add_candidate():
    payload = request.get_json() or {}
    election_id = payload.get("election_id")
    name = payload.get("name", "").strip()
    position = payload.get("position", "").strip()
    photo_url = payload.get("photo_url", "").strip()

    if not all([election_id, name, position]):
        return jsonify({"error": "Election, name, and position are required"}), 400

    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    candidate = Candidate(
        election_id=election_id, name=name, position=position, photo_url=photo_url
    )
    db.session.add(candidate)
    db.session.commit()

    return jsonify({"message": "Candidate added", "candidate_id": candidate.id}), 201


@app.route("/admin/register-voter", methods=["POST"])
@admin_required
def register_voter():
    student_id = request.form.get("student_id", "").strip()
    name = request.form.get("name", "").strip()
    department = request.form.get("department", "").strip()
    biometric_file = request.files.get("biometric")

    if not all([student_id, name, department, biometric_file]):
        return jsonify({"error": "student_id, name, department and biometric are required"}), 400

    if Voter.query.filter_by(student_id=student_id).first():
        return jsonify({"error": "Voter already exists"}), 409

    voter = Voter(
        student_id=student_id,
        name=name,
        department=department,
        biometric_hash=biometric_digest(biometric_file),
    )
    db.session.add(voter)
    db.session.commit()

    return jsonify({"message": "Voter registered", "voter_id": voter.id}), 201


@app.route("/admin/elections/<int:election_id>/toggle", methods=["PATCH"])
@admin_required
def toggle_voting(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404
    election.is_active = not election.is_active
    db.session.commit()
    return jsonify({"message": "Election status updated", "is_active": election.is_active})


@app.route("/admin/stats/<int:election_id>", methods=["GET"])
@admin_required
def election_stats(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    total_voters = Voter.query.count()
    votes_cast = Vote.query.filter_by(election_id=election_id).count()

    candidate_totals = (
        db.session.query(Candidate.id, Candidate.name, Candidate.position, db.func.count(Vote.id))
        .outerjoin(Vote, Vote.candidate_id == Candidate.id)
        .filter(Candidate.election_id == election_id)
        .group_by(Candidate.id)
        .all()
    )

    return jsonify(
        {
            "election": {"id": election.id, "name": election.name, "is_active": election.is_active},
            "total_voters": total_voters,
            "votes_cast": votes_cast,
            "turnout_percent": round((votes_cast / total_voters) * 100, 2) if total_voters else 0,
            "candidate_stats": [
                {"candidate_id": row[0], "name": row[1], "position": row[2], "votes": row[3]}
                for row in candidate_totals
            ],
        }
    )


@app.route("/admin/declare-results/<int:election_id>", methods=["PATCH"])
@admin_required
def declare_results(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404
    election.is_active = False
    election.is_published = True
    db.session.commit()
    return jsonify({"message": "Results published"})


@app.route("/admin/logout", methods=["POST"])
@jwt_required()
def admin_logout():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    jti = claims["jti"]
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
    return jsonify({"message": "Logged out"})


@app.route("/voter/login", methods=["POST"])
def voter_login():
    payload = request.get_json() or {}
    student_id = payload.get("student_id", "").strip()

    voter = Voter.query.filter_by(student_id=student_id).first()
    if not voter:
        return jsonify({"error": "Voter not found"}), 404

    token = create_access_token(identity=str(voter.id), additional_claims={"role": "voter"}, expires_delta=timedelta(hours=1))
    return jsonify({"token": token, "voter": {"id": voter.id, "name": voter.name, "student_id": voter.student_id}})


@app.route("/voter/verify-biometric", methods=["POST"])
@voter_required
def verify_biometric():
    voter_id = int(get_jwt_identity())
    voter = Voter.query.get(voter_id)
    biometric_file = request.files.get("biometric")
    if not biometric_file:
        return jsonify({"error": "Biometric image required"}), 400

    uploaded_hash = biometric_digest(biometric_file)
    match = hmac.compare_digest(uploaded_hash, voter.biometric_hash)

    return jsonify({"verified": match, "message": "Biometric matched" if match else "Biometric mismatch"}), (200 if match else 401)


@app.route("/voter/active-elections", methods=["GET"])
@voter_required
def active_elections():
    elections = Election.query.filter_by(is_active=True).all()
    return jsonify(
        [
            {
                "id": e.id,
                "name": e.name,
                "club_name": e.club_name,
                "date": e.election_date.isoformat(),
            }
            for e in elections
        ]
    )


@app.route("/voter/elections/<int:election_id>/candidates", methods=["GET"])
@voter_required
def list_candidates(election_id):
    candidates = Candidate.query.filter_by(election_id=election_id).all()
    return jsonify(
        [
            {
                "id": c.id,
                "name": c.name,
                "position": c.position,
                "photo_url": c.photo_url,
            }
            for c in candidates
        ]
    )


@app.route("/voter/cast-vote", methods=["POST"])
@voter_required
def cast_vote():
    voter_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    election_id = payload.get("election_id")
    candidate_id = payload.get("candidate_id")

    if not all([election_id, candidate_id]):
        return jsonify({"error": "election_id and candidate_id are required"}), 400

    election = Election.query.get(election_id)
    candidate = Candidate.query.get(candidate_id)
    if not election or not candidate or candidate.election_id != election.id:
        return jsonify({"error": "Invalid election/candidate"}), 400

    if not election.is_active:
        return jsonify({"error": "Voting is not active"}), 400

    already_voted = Vote.query.filter_by(election_id=election_id, voter_id=voter_id).first()
    if already_voted:
        return jsonify({"error": "You have already voted in this election"}), 409

    vote = Vote(election_id=election_id, voter_id=voter_id, candidate_id=candidate_id)
    db.session.add(vote)
    db.session.commit()

    return jsonify({"message": "Vote successfully recorded"}), 201


@app.route("/voter/logout", methods=["POST"])
@jwt_required()
def voter_logout():
    claims = get_jwt()
    if claims.get("role") != "voter":
        return jsonify({"error": "Voter access required"}), 403

    jti = claims["jti"]
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
    return jsonify({"message": "Logged out"})


@app.route("/results", methods=["GET"])
def published_results():
    elections = Election.query.filter_by(is_published=True).all()
    response = []

    for election in elections:
        rows = (
            db.session.query(Candidate.name, Candidate.position, db.func.count(Vote.id).label("vote_count"))
            .outerjoin(Vote, Vote.candidate_id == Candidate.id)
            .filter(Candidate.election_id == election.id)
            .group_by(Candidate.id)
            .order_by(db.desc("vote_count"))
            .all()
        )
        response.append(
            {
                "election": election.name,
                "club": election.club_name,
                "date": election.election_date.isoformat(),
                "results": [
                    {"candidate": r[0], "position": r[1], "votes": r[2]} for r in rows
                ],
            }
        )

    return jsonify(response)


@app.cli.command("seed")
def seed_data():
    db.create_all()

    if not Admin.query.filter_by(username="admin").first():
        db.session.add(
            Admin(username="admin", password_hash=generate_password_hash("admin@123"))
        )

    if not Voter.query.filter_by(student_id="STU001").first():
        sample_hash = hashlib.sha256(b"sample-image-data" + b"demo-pepper").hexdigest()
        db.session.add(
            Voter(
                student_id="STU001",
                name="Aarav Sharma",
                department="Computer Science",
                biometric_hash=sample_hash,
            )
        )

    db.session.commit()
    print("Seed data created. Admin: admin/admin@123, Voter: STU001")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0", port=5000)
