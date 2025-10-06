# Quiz Master - Team Quiz Application

A modern web application that creates interactive quizzes using Google Sheets as the data source. Teams compete in a structured quiz format with real-time leaderboards and answer feedback.

## Features

- 📊 **Google Sheets Integration**: Load teams and questions directly from Google Sheets
- 👥 **Team Management**: Support for multiple teams with individual scoring
- 🎯 **Question Format**: Multiple choice questions with automatic answer validation
- 🏆 **Real-time Leaderboard**: Live scoring updates and team rankings
- ✨ **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Friendly**: Works on all devices and screen sizes

## How to Use

### 1. Prepare Your Google Sheets

#### Teams Sheet
Create a Google Sheet with your team names in column A:
```
Team Alpha
Team Beta
Team Gamma
Team Delta
```

#### Questions Sheet
Create a Google Sheet with your questions in this format:

| Question | Option A | Option B | Option C | Option D | Correct Answer | Points |
|----------|----------|----------|----------|----------|----------------|--------|
| What is the capital of France? | London | Berlin | Paris | Madrid | C | 10 |
| Which planet is closest to the Sun? | Venus | Mercury | Earth | Mars | B | 15 |

**Important Notes:**
- Use A, B, C, D for correct answers (or 1, 2, 3, 4)
- Include a header row (optional)
- Points column is optional (defaults to 10)
- Share both sheets with "Anyone with the link can view"

### 2. Set Up the Quiz

1. Open `index.html` in your web browser
2. Enter the Google Sheets URLs for teams and questions
3. Click "Start Quiz" to begin

### 3. Running the Quiz

- Questions are presented one at a time to each team
- Teams select their answer and submit
- Immediate feedback shows if the answer is correct
- Scores are updated in real-time on the leaderboard
- The quiz continues until all questions are answered by all teams

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styles and animations
├── script.js           # JavaScript application logic
└── README.md           # This file
```

## Technical Details

### Google Sheets Integration
The app uses Google Sheets export functionality to read sheet content as CSV. No API keys or authentication required - just share your sheets publicly.

### Question Format Support
- Multiple choice questions (A, B, C, D)
- Automatic correct answer detection
- Flexible question numbering
- Point values (default: 10 points per question)

### Scoring System
- Points awarded for correct answers
- Real-time score updates
- Team-based scoring with leaderboard rankings
- Support for different point values per question

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Customization

### Styling
Edit `styles.css` to customize:
- Colors and themes
- Fonts and typography
- Layout and spacing
- Animations and transitions

### Functionality
Edit `script.js` to modify:
- Question formats
- Scoring rules
- Team rotation logic
- Answer validation

## Troubleshooting

### Common Issues

1. **"Failed to load sheet"**
   - Ensure the Google Sheet is shared with "Anyone with the link can view"
   - Check that the URL is correct and accessible

2. **"No teams or questions found"**
   - Verify the sheet format matches the expected structure
   - Check that questions have all required columns (Question, Option A, Option B, Option C, Option D, Correct Answer)
   - Ensure correct answers are marked with A, B, C, D (or 1, 2, 3, 4)

3. **Questions not displaying correctly**
   - Make sure correct answers are marked with A, B, C, D in the Correct Answer column
   - Verify the sheet has the proper column structure
   - Check that all required columns are filled

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Sheets are properly formatted
3. Ensure sheets are publicly accessible
4. Try refreshing the page and starting over

## License

This project is open source and available under the MIT License.
