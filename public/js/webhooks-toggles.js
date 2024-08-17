function restoreToggleStates() {
    document.querySelectorAll('input[type="checkbox"][id^="webhook-toggle-"]').forEach(toggle => {
        const storedState = localStorage.getItem(toggle.id);
        if (storedState !== null) {
            toggle.checked = JSON.parse(storedState);
        }
    });
}

function saveToggleState(event) {
    if (event.target.matches('input[type="checkbox"][id^="webhook-toggle-"]')) {
        localStorage.setItem(event.target.id, event.target.checked);
    }
}

document.addEventListener('DOMContentLoaded', restoreToggleStates);

document.addEventListener('change', saveToggleState);
