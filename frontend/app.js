const API_URL = 'http://localhost:3000/api';

// Fetch and display upcoming sessions
async function loadUpcomingSessions() {
    try {
        const response = await fetch(`${API_URL}/sessions/upcoming`);
        const sessions = await response.json();
        displaySessions(sessions, 'upcomingSessions');
    } catch (error) {
        console.error('Error loading upcoming sessions:', error);
    }
}

// Fetch and display all sessions
async function loadAllSessions() {
    try {
        const response = await fetch(`${API_URL}/sessions`);
        const sessions = await response.json();
        displaySessions(sessions, 'allSessions');
    } catch (error) {
        console.error('Error loading all sessions:', error);
    }
}

// Display sessions in the specified container
function displaySessions(sessions, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    sessions.forEach(session => {
        const startTime = new Date(session.startTime);
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card session-card">
                <div class="card-body">
                    <span class="status-badge badge bg-${getStatusColor(session.status)}">
                        ${session.status}
                    </span>
                    <h5 class="card-title">${session.title}</h5>
                    <p class="card-text">
                        <strong>Start:</strong> ${startTime.toLocaleString()}<br>
                        <strong>Duration:</strong> ${session.duration} minutes<br>
                        <strong>Participants:</strong> ${
                            session.participants.students.length + 
                            session.participants.tutors.length
                        }
                    </p>
                    <button class="btn btn-sm btn-danger" onclick="deleteSession('${session._id}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Add new session
async function addSession() {
    const form = document.getElementById('addSessionForm');
    const formData = new FormData(form);
    
    const sessionData = {
        title: formData.get('title'),
        meetLink: formData.get('meetLink'),
        startTime: new Date(formData.get('startTime')).toISOString(),
        duration: parseInt(formData.get('duration')),
        participants: {
            tutors: formData.get('tutors').split(',').map(email => email.trim()),
            students: formData.get('students').split(',').map(email => email.trim())
        }
    };

    try {
        const response = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });

        if (response.ok) {
            // Close modal and refresh sessions
            bootstrap.Modal.getInstance(document.getElementById('addSessionModal')).hide();
            form.reset();
            loadUpcomingSessions();
            loadAllSessions();
        } else {
            alert('Error adding session');
        }
    } catch (error) {
        console.error('Error adding session:', error);
        alert('Error adding session');
    }
}

// Delete session
async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadUpcomingSessions();
            loadAllSessions();
        } else {
            alert('Error deleting session');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        alert('Error deleting session');
    }
}

// Helper function to get status color
function getStatusColor(status) {
    switch (status) {
        case 'scheduled': return 'primary';
        case 'active': return 'success';
        case 'completed': return 'secondary';
        case 'failed': return 'danger';
        default: return 'primary';
    }
}

// Load sessions when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUpcomingSessions();
    loadAllSessions();
    // Refresh every minute
    setInterval(() => {
        loadUpcomingSessions();
        loadAllSessions();
    }, 60000);
});
