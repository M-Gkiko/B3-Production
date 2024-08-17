document.addEventListener('DOMContentLoaded', function () {
        var simplemde = new SimpleMDE();
        const commentForm = document.getElementById("comment-form");
        const commentButton = document.getElementById("comment-button");
        commentButton.disabled = true;
        simplemde.codemirror.on("change", function(){
                if (simplemde.value().trim() !== "") {
                        commentButton.classList.add("blue-button");
                        commentButton.disabled = false;
                } else {
                        commentButton.classList.remove("blue-button");
                        commentButton.disabled = true;
                }
        });
        commentForm.addEventListener('htmx:afterRequest', function(event) {
                simplemde.value("");
                commentButton.classList.remove("blue-button");
                commentButton.disabled = true;
        });
});
