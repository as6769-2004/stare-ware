# Stare-Ware Test Platform

A comprehensive online test platform with face recognition, anti-cheating measures, and advanced test management features.

## Features

### 🎯 Test Creation & Management
- **Interactive MCQ Builder**: Create tests with multiple choice questions
- **Media Support**: Add images, audio, and video to questions and options
- **Rich Text Editor**: Format questions with explanations and detailed content
- **Test Validation**: Automatic validation ensures all questions are complete
- **Test Status Management**: Draft, Published, Live, and Closed states

### 🔒 Anti-Cheating System
- **Face Recognition**: Real-time face detection using face-api.js
- **Fullscreen Monitoring**: Detects attempts to exit fullscreen mode
- **Tab Switching Detection**: Monitors for switching between tabs/applications
- **Warning System**: 3-strike warning system before auto-submission
- **Automatic Submission**: Auto-submits test after multiple violations

### 👤 User Authentication
- **Google Sign-In**: Secure authentication with Google accounts
- **User Profiles**: Personal dashboard with test statistics
- **Test Ownership**: Users can only access their own tests

### 📊 Test Taking Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Timer Management**: Configurable time limits per test
- **Progress Tracking**: Visual progress indicators
- **Question Navigation**: Easy navigation between questions
- **Auto-Save**: Automatic saving of answers

### 🎨 Modern UI/UX
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Layout**: Optimized for all screen sizes
- **Intuitive Navigation**: Easy-to-use interface
- **Real-time Feedback**: Immediate validation feedback

## Technology Stack

- **Frontend**: React 19, React Router DOM
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Face Recognition**: face-api.js
- **Webcam**: react-webcam
- **State Management**: React Hooks

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stare-ware
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication (Google provider)
   - Add your Firebase config to `src/firebase.js`

4. Start the development server:
```bash
npm start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Usage

### For Test Creators

1. **Sign In**: Use Google authentication to access the platform
2. **Create Test**: Navigate to "Create Test" to build your MCQ test
3. **Add Questions**: Use the interactive builder to add questions with media
4. **Validate**: Ensure all questions are complete before publishing
5. **Publish**: Make your test available for students
6. **Monitor**: Track test performance and results

### For Test Takers

1. **Access Test**: Use the provided test link
2. **Read Rules**: Review test rules and regulations
3. **Face Setup**: Position your face for recognition
4. **Take Test**: Answer questions within the time limit
5. **Submit**: Complete the test to see results

## Anti-Cheating Features

### Face Recognition
- Real-time face detection during the test
- Requires face to be visible at all times
- 5-second grace period for face detection

### Fullscreen Monitoring
- Detects attempts to exit fullscreen mode
- Warns users about fullscreen violations
- Auto-submits after 3 warnings

### Tab Switching Detection
- Monitors for switching between browser tabs
- Detects attempts to use other applications
- Immediate warning for suspicious activity

### Warning System
- 3-strike warning system
- Clear notifications for violations
- Automatic test submission after multiple violations

## Test States

- **Draft**: Test is being created/edited
- **Published**: Test is ready but not active
- **Live**: Test is available for students
- **Closed**: Test is no longer accessible

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Note**: This platform requires camera access for face recognition features. Make sure to test on HTTPS in production for camera access to work properly.
