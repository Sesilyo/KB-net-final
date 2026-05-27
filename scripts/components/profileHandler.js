// FILENAME: scripts/components/profileHandler.js

export function initProfile() {

    //Load and populate fields 
    async function loadProfile() {
        try {
            const res  = await fetch('../api/getProfile.php');
            const data = await res.json();

            if (!data.success) {
                console.error('Failed to load profile:', data.error);
                if (res.status === 401) window.location.href = '../pages/login_signup.html';
                return;
            }

            const u = data.user;
            document.getElementById('firstname-input').value    = u.first_name  ?? '';
            document.getElementById('lastname-input').value     = u.last_name   ?? '';
            document.getElementById('studentid-input').value    = u.student_id  ?? '';
            document.getElementById('email-input').value        = u.email       ?? '';
            document.getElementById('lenderid-display').value   = u.lender_id   ?? '';
            document.getElementById('borrowerid-display').value = u.borrower_id ?? '';

        } catch (err) {
            console.error('Network error loading profile:', err);
        }
    }

    // EDIT button 
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.field;
            const input = document.getElementById(`${field}-input`);

            input.disabled = false;
            input.focus();
            btn.textContent = 'EDITING';

            document.getElementById('save-changes-btn').style.display  = 'inline-block';
            document.getElementById('cancel-changes-btn').style.display = 'inline-block';
        });
    });

    // Save 
    document.getElementById('save-changes-btn').addEventListener('click', async () => {
        const editableFields = ['firstname', 'lastname', 'studentid', 'email'];

        for (const field of editableFields) {
            const input = document.getElementById(`${field}-input`);
            if (input.disabled) continue;

            try {
                const res  = await fetch('../api/editProfile.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ field, value: input.value })
                });
                const data = await res.json();

                if (!data.success) {
                    alert(data.error ?? 'Something went wrong.');
                    return;
                }
            } catch (err) {
                alert('Network error. Please try again.');
                return;
            }
        }

        resetEditState();
        loadProfile();
    });

    document.getElementById('cancel-changes-btn').addEventListener('click', () => {
        resetEditState();
        loadProfile();
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('../api/logout.php', { method: 'POST' });
        } catch (_) {}
        window.location.href = '../pages/login_signup.html';
    });

    // ── Helpers ───────────────────────────────────────────────────────────
    function resetEditState() {
        document.querySelectorAll('.editable-input').forEach(i => i.disabled = true);
        document.querySelectorAll('.edit-btn').forEach(b => b.textContent = 'EDIT');
        document.getElementById('save-changes-btn').style.display  = 'none';
        document.getElementById('cancel-changes-btn').style.display = 'none';
    }

    // ── Run on init ───────────────────────────────────────────────────────
    loadProfile();
}