document.addEventListener('DOMContentLoaded', () => {
    const updatesDiv = document.getElementById('updates');
    let isInitialLoad = true;

    const savedContent = localStorage.getItem('updatesContent');
    if (savedContent) {
        updatesDiv.innerHTML = savedContent;
    }

    function saveContent() {
        localStorage.setItem('updatesContent', updatesDiv.innerHTML);
    }

    document.addEventListener('htmx:wsAfterMessage', function(event) {
        const message = event.detail.message;

        const parser = new DOMParser();
        const doc = parser.parseFromString(message, 'text/html');

        const updateDiv = doc.querySelector('#updates');
        if (updateDiv) {
            const newContent = updateDiv.innerHTML;
                saveContent();

            const updateType = updateDiv.getAttribute('data-update-type');
            switch (updateType) {
                case 'Issue':
                    htmx.trigger(document.body, 'update-issues-count');
                    saveContent();
                    break;
                case 'Merge':
                    htmx.trigger(document.body, 'update-merge-requests-count');
                    saveContent();
                    break;
                default:
                    console.warn('Unhandled update type:', updateType);
                    return;
            }
        }
    });

    window.addEventListener('load', () => {
        isInitialLoad = false;
    });
});
