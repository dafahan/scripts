const pin = '00158336'; // Replace with your desired pin

(async function () {
    // Function to fetch and categorize Quizizz answers using an API
    async function fetchAndCategorizeQuizizzAnswers(pin) {
        const url = `https://api.quizit.online/quizizz/answers?pin=${pin}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.status}`);
            }

            const data = await response.json();
            if (data.message !== "Ok") {
                throw new Error("Invalid response from API");
            }

            // Categorize questions
            const categorizedQuestions = data.data.answers.map((answerData) => {
                const questionText = answerData.question.text.replace(/<[^>]*>/g, '').trim();
                const answers = answerData.answers.map((ans) => ans.text.replace(/<[^>]*>/g, '').trim());
                const type = answerData.type;

                let category;
                if (type === "MSQ") {
                    category = "Multiple"; // Multiple correct answers
                } else if (type === "MCQ") {
                    category = answers.length > 1 ? "Multiple" : "Single"; // Single or multiple
                } else if (type === "BLANK") {
                    category = "Blank"; // Fill-in-the-blank
                } else {
                    category = "Unknown";
                }

                return {
                    question: questionText,
                    answers: answers,
                    category: category,
                };
            });

            console.log("Categorized Questions:", categorizedQuestions);
            return categorizedQuestions;
        } catch (error) {
            console.error("Error:", error);
            return [];
        }
    }

    // Utility to wait for a DOM element to appear
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let elapsed = 0;

            const check = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(check);
                    resolve(element);
                }
                elapsed += interval;
                if (elapsed >= timeout) {
                    clearInterval(check);
                    reject(new Error("Element not found: " + selector));
                }
            }, interval);
        });
    }

    // Fetches the current question's text
    function getCurrentQuestionText() {
        const questionTextElement = document.querySelector('[data-testid="question-container-text"]');
        return questionTextElement ? questionTextElement.textContent.trim() : "";
    }

    function clickTextAnswer(answer) {
        // Query all buttons with 'option' class
        const options = [...document.querySelectorAll('button.option')];
    
        if (!options.length) {
            console.error("No options found!");
            return;
        }
    
        // Find the option where the inner text matches the answer
        const option = options.find((opt) => {
            const textElement = opt.querySelector('p'); // Target the <p> tag within the option
            return textElement && textElement.textContent.trim() === answer;
        });
    
        if (option) {
            option.click(); // Click the matched option
            console.log(`Clicked option: "${answer}"`);
        } else {
            console.error(`Answer not found: "${answer}"`);
        }
    }

    // Clicks the checkboxes for multiple-choice questions
    function clickCheckboxAnswers(expectedAnswers) {
        const checkboxContainers = [...document.querySelectorAll('.option')];
        expectedAnswers.forEach((expectedAnswer) => {
            const checkbox = checkboxContainers.find((container) => {
                const label = container.querySelector('.resizeable-text p')?.textContent.trim();
                return label === expectedAnswer;
            });
            if (checkbox && !checkbox.classList.contains('selected')) {
                checkbox.click(); // Select the checkbox
            }
        });
    }

    // Types the answer into blank input fields
    function typeBlankAnswer(answer) {
        const inputBoxes = [...document.querySelectorAll('input[data-cy^="box"]')];
        const chars = answer.split(""); // Split the answer into characters

        if (inputBoxes.length !== chars.length) {
            console.error("Mismatch between input boxes and answer length");
            return;
        }

        inputBoxes.forEach((input, index) => {
            input.value = chars[index]; // Set the character in the input box
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event); // Trigger the input event
        });

        console.log("Typed answer:", answer);
    }

    // Clicks the submit button
    function submitAnswer() {
        const submitButton = document.querySelector('button[data-cy="submit-button"][data-testid="button"]');
        if (submitButton && !submitButton.disabled) {
            console.log("Clicking the submit button...");
            submitButton.click();
        } else {
            console.error("Submit button not found or is disabled!");
        }
    }

    const questions = await fetchAndCategorizeQuizizzAnswers(pin);

    const answeredQuestions = new Set();

    while (answeredQuestions.size < questions.length) {
        try {
            // Wait for the question container to appear
            await waitForElement('[data-testid="question-container"]');

            // Ensure the current question matches
            const currentQuestion = getCurrentQuestionText();
            const questionData = questions.find((q) => q.question === currentQuestion);

            if (!questionData || answeredQuestions.has(currentQuestion)) {
                console.warn("Question mismatch or already answered. Skipping...");
                continue;
            }

            const { answers, category } = questionData;

            // Answer based on category
            if (category === "Single") {
                clickTextAnswer(answers[0]); // Click the single answer
            } else if (category === "Multiple") {
                clickCheckboxAnswers(answers); // Select all correct answers
                await new Promise((resolve) => setTimeout(resolve, 2000));
                submitAnswer(); // Click the submit button
            } else if (category === "Blank") {
                typeBlankAnswer(answers[0]); // Type the answer character by character
                await new Promise((resolve) => setTimeout(resolve, 2000));
                submitAnswer(); // Click the submit button
            }

            // Add question to the answered set
            answeredQuestions.add(currentQuestion);

            // Wait for the next question to render
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
            console.error("Error while processing question:", error);
            break;
        }
    }

    console.log("All questions answered!");
})();
