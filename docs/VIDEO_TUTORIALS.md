# Video Tutorials Guide

> Structured guide for creating video tutorials for PTF framework

---

## Planned Tutorial Series

### 1. Getting Started (15 minutes)

- Framework installation
- Project structure walkthrough
- Running first test
- Understanding fixtures and app manager

### 2. Writing Tests (20 minutes)

- Creating page objects
- Using BasePage utilities
- Writing test scenarios
- Assertions and best practices

### 3. Data Management (15 minutes)

- Test data generation
- Using TestDataProvider
- Database integration
- Data factories

### 4. Advanced Features (25 minutes)

- Visual regression testing
- API testing with ApiClient
- File operations
- Multi-tab scenarios

### 5. CI/CD Integration (20 minutes)

- GitHub Actions setup
- Docker containerization
- Allure reporting
- Notifications

---

## Recording Setup

### Tools

- **Screen Recording**: OBS Studio or Camtasia
- **Video Editing**: DaVinci Resolve (free) or Adobe Premiere
- **Annotations**: ScreenFlow or Camtasia

ia

### Settings

```
Resolution: 1920x1080
Frame Rate: 30 FPS
Audio: 48kHz, mono
Format: MP4 (H.264)
```

---

## Tutorial Scripts

### Example: "Your First Test" (5-minute segment)

````markdown
1. INTRO (30s)
   "Welcome to PTF! Today we'll write our first test in under 5 minutes."

2. SHOW PAGE OBJECT (1m30s)
   - Open LoginPage.ts
   - Explain locators
   - Explain actions

3. WRITE TEST (2m)
   ```typescript
   test('login successfully', async ({ app }) => {
     await app.login.open();
     await app.login.login('user', 'pass');
     await expect(app.dashboard.title).toBeVisible();
   });
   ```
````

4. RUN TEST (1m)
   - Terminal: npm test
   - Show passing result
   - Show HTML report

5. CONCLUSION (30s)
   "You've written your first PTF test! Next: advanced patterns."

```

---

## Publishing Platforms

- **YouTube**: Main channel
- **Vimeo**: Enterprise access
- **Internal**: Company LMS

---

## Video Naming Convention

```

PTF-{Series}-{Number}-{Title}-{Duration}

Examples:

- PTF-GettingStarted-01-Installation-10min
- PTF-Advanced-03-VisualRegression-15min

```

---

## Accessibility

- Add closed captions (auto-generate, then review)
- Include chapter markers
- Provide transcript in video description

---

## Resources

- [OBS Studio](https://obsproject.com/)
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve)
- [YouTube Creator Academy](https://creatoracademy.youtube.com/)

---

*Status: Planning Phase | January 2026*
```
