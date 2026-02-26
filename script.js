document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen.toString());
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const status = signupForm.querySelector('.form-status');
            status.textContent = '';

            const name = signupForm.querySelector('#signupName').value.trim();
            const email = signupForm.querySelector('#signupEmail').value.trim();
            const confirmed = signupForm.querySelector('input[name="notify_confirmed"]').checked;

            if (!name || !email || !isValidEmail(email)) {
                status.textContent = 'Please enter a valid name and email.';
                return;
            }

            if (!confirmed) {
                status.textContent = 'Please confirm the notification email.';
                return;
            }

            const result = await submitForm(signupForm, { status });
            if (result.ok) {
                status.textContent = 'Thanks! You are signed up.';
                signupForm.reset();
            } else {
                status.textContent = 'Sorry, something went wrong. Please try again.';
            }
        });
    }

    document.querySelectorAll('form.quiz').forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (form.dataset.submitted === 'true') {
                return;
            }

            const status = form.querySelector('.quiz-status');
            status.textContent = '';

            const questions = Array.from(form.querySelectorAll('.question'));
            const unanswered = questions.filter((question) => !question.querySelector('input[type="radio"]:checked'));
            if (unanswered.length > 0) {
                status.textContent = 'Please answer all five questions before submitting.';
                return;
            }

            let score = 0;
            questions.forEach((question) => {
                const correctOption = question.querySelector('.option[data-correct="true"]');
                const selected = question.querySelector('input[type="radio"]:checked');

                question.querySelectorAll('.option').forEach((option) => {
                    option.classList.remove('is-correct', 'is-wrong');
                    const explanation = option.querySelector('.explanation');
                    if (explanation) {
                        explanation.textContent = '';
                    }
                });

                if (correctOption) {
                    const correctInput = correctOption.querySelector('input');
                    if (correctInput && correctInput.checked) {
                        score += 1;
                    }
                    correctOption.classList.add('is-correct');
                    const explanation = correctOption.querySelector('.explanation');
                    if (explanation) {
                        explanation.textContent = correctOption.dataset.explanation || '';
                    }
                }

                if (selected && (!correctOption || selected !== correctOption.querySelector('input'))) {
                    const selectedLabel = selected.closest('.option');
                    if (selectedLabel) {
                        selectedLabel.classList.add('is-wrong');
                    }
                }
            });

            const total = questions.length;
            status.textContent = `Score: ${score}/${total}. Correct answers are highlighted in green.`;
            form.dataset.submitted = 'true';
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Submitted';
                submitButton.disabled = true;
            }

            const result = await submitForm(form, { extraFields: { score: `${score}/${total}` } });
            if (!result.ok) {
                status.textContent = 'Score saved locally, but we could not send your submission. Please try again later.';
            }
        });
    });
});

function submitForm(form, { status, extraFields } = {}) {
    const formData = new FormData(form);
    if (extraFields) {
        Object.entries(extraFields).forEach(([key, value]) => {
            formData.append(key, value);
        });
    }
    const data = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        data.append(key, value);
    }

    return fetch(form.action, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: data
    }).then((response) => ({ ok: response.ok })).catch(() => ({ ok: false }));
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
