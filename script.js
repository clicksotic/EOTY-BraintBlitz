// Quiz Master Application
class QuizMaster {
    constructor() {
        this.teams = [];
        this.questions = [];
        this.teamQuestions = []; // Questions divided among teams
        this.currentTeamIndex = 0;
        this.currentQuestionIndex = 0;
        this.scores = {};
        this.selectedAnswer = null;
        this.isQuizActive = false;
        this.currentSection = 'setup'; // Track current section
        this.questionsPerTeam = 0; // Number of questions per team
        this.timer = null; // Timer reference
        this.timerDuration = 30; // Default timer duration in seconds
        this.timeLeft = 30; // Time left in seconds
        this.timerInterval = null; // Timer interval reference
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.loadState();
        this.showCurrentSection();
    }

    setupEventListeners() {
        // Setup form
        document.getElementById('startQuizBtn').addEventListener('click', () => this.startQuiz());
        
        // Quiz controls
        document.getElementById('submitAnswerBtn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('skipQuestionBtn').addEventListener('click', () => this.skipQuestion());
        document.getElementById('nextQuestionBtn').addEventListener('click', () => this.nextQuestion());
        
        // Modal controls
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        
        // Restart quiz
        document.getElementById('restartQuizBtn').addEventListener('click', () => this.restartQuiz());
    }

    async startQuiz() {
        const teamsUrl = document.getElementById('teamsDocUrl').value;
        const questionsUrl = document.getElementById('questionsDocUrl').value;
        const timerDuration = parseInt(document.getElementById('timerDuration').value);

        if (!teamsUrl || !questionsUrl) {
            alert('Please provide both document URLs');
            return;
        }

        // Validate timer duration
        if (isNaN(timerDuration) || timerDuration < 5 || timerDuration > 300) {
            alert('Please enter a valid timer duration between 5 and 300 seconds');
            return;
        }

        // Set timer duration
        this.timerDuration = timerDuration;
        this.timeLeft = timerDuration;

        this.showLoading(true);
        
        try {
            // Load teams and questions from Google Sheets
            await this.loadTeamsFromGoogleSheets(teamsUrl);
            await this.loadQuestionsFromGoogleSheets(questionsUrl);
            
            if (this.teams.length === 0 || this.questions.length === 0) {
                throw new Error('No teams or questions found in the documents');
            }

            // Initialize scores
            this.initializeScores();
            
            // Divide questions among teams
            this.divideQuestionsAmongTeams();
            
            // Start the quiz
            this.isQuizActive = true;
            this.currentTeamIndex = 0;
            this.currentQuestionIndex = 0;
            
            this.showQuizSection();
            this.updateCurrentTeamIndicator();
            this.displayQuestion();
            this.updateLeaderboard();
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Error loading quiz data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async loadTeamsFromGoogleSheets(url) {
        try {
            const sheetId = this.extractSheetId(url);
            const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
            const csv = await response.text();
            
            // Parse teams from CSV data
            this.teams = this.parseTeamsFromCSV(csv);
        } catch (error) {
            console.error('Error loading teams:', error);
            throw new Error('Failed to load teams sheet');
        }
    }

    async loadQuestionsFromGoogleSheets(url) {
        try {
            const sheetId = this.extractSheetId(url);
            const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
            const csv = await response.text();
            
            // Parse questions from CSV data
            this.questions = this.parseQuestionsFromCSV(csv);
        } catch (error) {
            console.error('Error loading questions:', error);
            throw new Error('Failed to load questions sheet');
        }
    }

    extractSheetId(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            throw new Error('Invalid Google Sheets URL');
        }
        return match[1];
    }

    parseTeamsFromCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        const teams = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                // Remove quotes and extra whitespace
                const teamName = trimmedLine.replace(/^["']|["']$/g, '').trim();
                if (teamName) {
                    teams.push(teamName);
                }
            }
        }
        
        return teams;
    }

    parseQuestionsFromCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        const questions = [];
        
        // Skip header row if present
        const dataLines = lines.slice(1);
        
        for (const line of dataLines) {
            const columns = this.parseCSVLine(line);
            
            if (columns.length >= 6) { // Question, Option A, Option B, Option C, Option D, Correct Answer
                const question = {
                    text: columns[0].trim(),
                    options: [
                        columns[1].trim(),
                        columns[2].trim(),
                        columns[3].trim(),
                        columns[4].trim()
                    ],
                    correctAnswer: this.getCorrectAnswerIndex(columns[5].trim()),
                    points: parseInt(columns[6]) || 10
                };
                
                if (question.text && question.correctAnswer !== null) {
                    questions.push(question);
                }
            }
        }
        
        return questions;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    getCorrectAnswerIndex(correctAnswer) {
        const answer = correctAnswer.toUpperCase().trim();
        if (answer === 'A' || answer === '1') return 0;
        if (answer === 'B' || answer === '2') return 1;
        if (answer === 'C' || answer === '3') return 2;
        if (answer === 'D' || answer === '4') return 3;
        return null;
    }

    initializeScores() {
        this.scores = {};
        this.teams.forEach(team => {
            this.scores[team] = 0;
        });
    }

    divideQuestionsAmongTeams() {
        this.questionsPerTeam = Math.floor(this.questions.length / this.teams.length);
        this.teamQuestions = [];
        
        // Divide questions among teams
        for (let i = 0; i < this.teams.length; i++) {
            const startIndex = i * this.questionsPerTeam;
            const endIndex = startIndex + this.questionsPerTeam;
            this.teamQuestions.push(this.questions.slice(startIndex, endIndex));
        }
        
        // Distribute remaining questions to first teams if there are extras
        const remainingQuestions = this.questions.length % this.teams.length;
        for (let i = 0; i < remainingQuestions; i++) {
            const questionIndex = this.questionsPerTeam * this.teams.length + i;
            this.teamQuestions[i].push(this.questions[questionIndex]);
        }
        
        console.log(`Divided ${this.questions.length} questions among ${this.teams.length} teams`);
        console.log(`Questions per team: ${this.questionsPerTeam} (with ${remainingQuestions} extra questions)`);
    }

    showSetupSection() {
        this.currentSection = 'setup';
        document.getElementById('setupSection').style.display = 'block';
        document.getElementById('quizSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('sidebar').style.display = 'none';
        this.saveState();
    }

    showQuizSection() {
        this.currentSection = 'quiz';
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('quizSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('sidebar').style.display = 'block';
        this.saveState();
    }

    showResultsSection() {
        this.currentSection = 'results';
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('quizSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('sidebar').style.display = 'none';
        this.saveState();
    }

    showCurrentSection() {
        switch(this.currentSection) {
            case 'quiz':
                this.showQuizSection();
                break;
            case 'results':
                this.showResultsSection();
                break;
            default:
                this.showSetupSection();
        }
    }

    displayQuestion() {
        const currentTeamQuestions = this.teamQuestions[this.currentTeamIndex];
        
        // Check if current team has finished their questions
        if (this.currentQuestionIndex >= currentTeamQuestions.length) {
            this.moveToNextTeam();
            return;
        }

        const question = currentTeamQuestions[this.currentQuestionIndex];
        
        // Update question display
        document.getElementById('questionNumber').textContent = `Question ${this.currentQuestionIndex + 1} of ${currentTeamQuestions.length}`;
        document.getElementById('questionPoints').textContent = `${question.points} points`;
        document.getElementById('questionText').textContent = question.text;
        
        // Create answer options
        const optionsContainer = document.getElementById('answerOptions');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'answer-option';
            optionElement.innerHTML = `
                <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionElement.addEventListener('click', () => this.selectAnswer(index));
            optionsContainer.appendChild(optionElement);
        });
        
        // Reset state
        this.selectedAnswer = null;
        document.getElementById('submitAnswerBtn').disabled = true;
        
        // Start timer for this question
        this.startTimer();
    }

    selectAnswer(index) {
        // Remove previous selection
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked option
        document.querySelectorAll('.answer-option')[index].classList.add('selected');
        
        this.selectedAnswer = index;
        document.getElementById('submitAnswerBtn').disabled = false;
    }

    submitAnswer() {
        if (this.selectedAnswer === null) return;
        
        // Stop the timer
        this.stopTimer();
        
        const currentTeamQuestions = this.teamQuestions[this.currentTeamIndex];
        const question = currentTeamQuestions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correctAnswer;
        
        // Update score
        if (isCorrect) {
            this.scores[this.teams[this.currentTeamIndex]] += question.points;
        }
        
        // Show answer feedback
        this.showAnswerFeedback(isCorrect, question);
        
        // Don't auto-advance - wait for manual next question button click
    }

    showAnswerFeedback(isCorrect, question) {
        const modal = document.getElementById('answerModal');
        const resultDiv = document.getElementById('answerResult');
        
        if (isCorrect) {
            resultDiv.className = 'answer-result correct';
            resultDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h4>Correct!</h4>
                <p>Great job, ${this.teams[this.currentTeamIndex]}! You earned ${question.points} points.</p>
                <p><small>Click "Next Question" to continue</small></p>
            `;
        } else {
            resultDiv.className = 'answer-result incorrect';
            const correctOption = question.options[question.correctAnswer];
            resultDiv.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <h4>Incorrect</h4>
                <p>The correct answer was: <strong>${correctOption}</strong></p>
                <p><small>Click "Next Question" to continue</small></p>
            `;
        }
        
        modal.classList.add('show');
    }

    nextQuestion() {
        this.closeModal();
        
        // Stop any running timer
        this.stopTimer();
        
        // Move to next question for current team
        this.currentQuestionIndex++;
        
        this.updateCurrentTeamIndicator();
        this.updateLeaderboard();
        
        // Check if current team has more questions
        const currentTeamQuestions = this.teamQuestions[this.currentTeamIndex];
        if (this.currentQuestionIndex < currentTeamQuestions.length) {
            this.displayQuestion();
        } else {
            // Current team finished, move to next team
            this.moveToNextTeam();
        }
    }

    moveToNextTeam() {
        // Move to next team
        this.currentTeamIndex++;
        this.currentQuestionIndex = 0; // Reset question index for new team
        
        // Check if all teams have finished
        if (this.currentTeamIndex >= this.teams.length) {
            this.endQuiz();
            return;
        }
        
        this.updateCurrentTeamIndicator();
        this.updateLeaderboard();
        this.displayQuestion();
    }

    skipQuestion() {
        // Stop the timer
        this.stopTimer();
        
        // Move to next question for current team
        this.currentQuestionIndex++;
        
        this.updateCurrentTeamIndicator();
        this.updateLeaderboard();
        
        // Check if current team has more questions
        const currentTeamQuestions = this.teamQuestions[this.currentTeamIndex];
        if (this.currentQuestionIndex < currentTeamQuestions.length) {
            this.displayQuestion();
        } else {
            // Current team finished, move to next team
            this.moveToNextTeam();
        }
    }

    updateCurrentTeamIndicator() {
        document.getElementById('currentTeamName').textContent = this.teams[this.currentTeamIndex];
    }

    updateTeamIndicatorForResults() {
        const teamLabel = document.getElementById('teamLabel');
        const teamName = document.getElementById('currentTeamName');
        
        // Find the winning team
        const sortedTeams = Object.entries(this.scores).sort(([,a], [,b]) => b - a);
        const winningTeam = sortedTeams[0][0];
        
        teamLabel.textContent = 'Winning Team:';
        teamName.textContent = winningTeam;
    }

    updateLeaderboard() {
        const leaderboard = document.getElementById('leaderboard');
        const sortedTeams = Object.entries(this.scores)
            .sort(([,a], [,b]) => b - a);
        
        leaderboard.innerHTML = '';
        
        sortedTeams.forEach(([team, score], index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${team === this.teams[this.currentTeamIndex] ? 'current-team' : ''}`;
            
            const rankClass = index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : 'other';
            
            item.innerHTML = `
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="team-info">
                    <div class="team-name">${team}</div>
                </div>
                <div class="team-score">${score}</div>
            `;
            
            leaderboard.appendChild(item);
        });
    }

    endQuiz() {
        this.isQuizActive = false;
        this.updateTeamIndicatorForResults();
        this.showResultsSection();
        this.displayFinalResults();
        this.saveState();
    }

    displayFinalResults() {
        const finalLeaderboard = document.getElementById('finalLeaderboard');
        const sortedTeams = Object.entries(this.scores)
            .sort(([,a], [,b]) => b - a);
        
        finalLeaderboard.innerHTML = '';
        
        sortedTeams.forEach(([team, score], index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rankClass = index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : 'other';
            
            item.innerHTML = `
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="team-info">
                    <div class="team-name">${team}</div>
                </div>
                <div class="team-score">${score}</div>
            `;
            
            finalLeaderboard.appendChild(item);
        });
    }

    closeModal() {
        document.getElementById('answerModal').classList.remove('show');
    }

    restartQuiz() {
        this.teams = [];
        this.questions = [];
        this.teamQuestions = [];
        this.questionsPerTeam = 0;
        this.currentTeamIndex = 0;
        this.currentQuestionIndex = 0;
        this.scores = {};
        this.selectedAnswer = null;
        this.isQuizActive = false;
        this.timerDuration = 30;
        this.timeLeft = 30;
        
        // Stop any running timer
        this.stopTimer();
        
        // Clear form inputs
        document.getElementById('teamsDocUrl').value = '';
        document.getElementById('questionsDocUrl').value = '';
        document.getElementById('timerDuration').value = '30';
        
        // Clear saved state
        this.clearState();
        
        this.showSetupSection();
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    // State Management Methods
    saveState() {
        const state = {
            currentSection: this.currentSection,
            teams: this.teams,
            questions: this.questions,
            teamQuestions: this.teamQuestions,
            questionsPerTeam: this.questionsPerTeam,
            currentTeamIndex: this.currentTeamIndex,
            currentQuestionIndex: this.currentQuestionIndex,
            scores: this.scores,
            isQuizActive: this.isQuizActive,
            timerDuration: this.timerDuration,
            timeLeft: this.timeLeft
        };
        localStorage.setItem('eotyQuizState', JSON.stringify(state));
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('eotyQuizState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.currentSection = state.currentSection || 'setup';
                this.teams = state.teams || [];
                this.questions = state.questions || [];
                this.teamQuestions = state.teamQuestions || [];
                this.questionsPerTeam = state.questionsPerTeam || 0;
                this.currentTeamIndex = state.currentTeamIndex || 0;
                this.currentQuestionIndex = state.currentQuestionIndex || 0;
                this.scores = state.scores || {};
                this.isQuizActive = state.isQuizActive || false;
                this.timerDuration = state.timerDuration || 30;
                this.timeLeft = state.timeLeft || this.timerDuration;
                
                // If we have quiz data, restore the UI
                if (this.teams.length > 0) {
                    this.updateCurrentTeamIndicator();
                    this.updateLeaderboard();
                }
                
                // If teamQuestions don't exist, recreate them
                if (this.teamQuestions.length === 0 && this.questions.length > 0 && this.teams.length > 0) {
                    this.divideQuestionsAmongTeams();
                }
                
                // If we're in quiz mode and have questions, display current question
                if (this.currentSection === 'quiz' && this.questions.length > 0) {
                    this.displayQuestion();
                }
                
                // If we're in results mode, show winning team
                if (this.currentSection === 'results') {
                    this.updateTeamIndicatorForResults();
                    this.displayFinalResults();
                }
            }
        } catch (error) {
            console.error('Error loading state:', error);
            // If there's an error, reset to setup
            this.currentSection = 'setup';
        }
    }

    clearState() {
        localStorage.removeItem('eotyQuizState');
    }

    // Timer Methods
    startTimer() {
        this.timeLeft = this.timerDuration;
        this.updateTimerDisplay();
        this.updateTimerStyle();
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            this.updateTimerStyle();
            
            if (this.timeLeft <= 0) {
                this.timerExpired();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.timeLeft = this.timerDuration;
        this.updateTimerDisplay();
        this.updateTimerStyle();
    }

    updateTimerDisplay() {
        const timerText = document.getElementById('timerText');
        if (timerText) {
            timerText.textContent = this.timeLeft;
        }
    }

    updateTimerStyle() {
        const timerCircle = document.getElementById('timerCircle');
        if (timerCircle) {
            // Remove all timer classes
            timerCircle.classList.remove('warning', 'danger');
            
            // Calculate warning thresholds based on timer duration
            const dangerThreshold = Math.max(1, Math.floor(this.timerDuration * 0.1)); // 10% of total time
            const warningThreshold = Math.max(2, Math.floor(this.timerDuration * 0.25)); // 25% of total time
            
            // Add appropriate class based on time left
            if (this.timeLeft <= dangerThreshold) {
                timerCircle.classList.add('danger');
            } else if (this.timeLeft <= warningThreshold) {
                timerCircle.classList.add('warning');
            }
        }
    }

    timerExpired() {
        this.stopTimer();
        
        // Mark question as incorrect due to timeout
        const currentTeamQuestions = this.teamQuestions[this.currentTeamIndex];
        const question = currentTeamQuestions[this.currentQuestionIndex];
        
        // Show timeout feedback
        this.showTimeoutFeedback(question);
        
        // Auto-advance after showing feedback
        setTimeout(() => {
            this.nextQuestion();
        }, 2000);
    }

    showTimeoutFeedback(question) {
        const modal = document.getElementById('answerModal');
        const resultDiv = document.getElementById('answerResult');
        
        resultDiv.className = 'answer-result timeout';
        resultDiv.innerHTML = `
            <i class="fas fa-clock"></i>
            <h4>Time's Up!</h4>
            <p>You ran out of time for this question.</p>
            <p>The correct answer was: <strong>${question.options[question.correctAnswer]}</strong></p>
            <p><small>Moving to next question in 2 seconds...</small></p>
        `;
        
        modal.classList.add('show');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizMaster();
});