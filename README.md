# Time Tracking & Pay Calculator

A one-page React application built with Vite that tracks employee attendance, calculates late arrivals and early departures, and automatically determines bonus eligibility based on attendance rules.

## What is this?

This application is a time tracking and payroll calculation tool designed to:

- Track daily attendance with flexible time input formats
- Calculate late arrivals and early departures automatically
- Determine bonus eligibility based on attendance performance
- Generate accurate pay calculations including basic pay and bonuses

## Why this exists?

This tool simplifies the process of:
- **Attendance Tracking**: Record time in and time out for each working day
- **Automatic Calculations**: No manual math needed - the app calculates minutes late, minutes early, and working hours automatically
- **Bonus Management**: Automatically applies bonus rules based on total late minutes
- **Payroll Processing**: Quickly calculate total pay including basic salary and bonuses

## Features

### 📅 Flexible Date Range
- Working month is defined as the 26th of the previous month to the 25th of the selected month
- Automatically generates all dates in the range for easy tracking

### ⏰ Flexible Time Input
- Accepts multiple time formats:
  - 12-hour format: `9:30 AM`, `6:30 PM`
  - 24-hour format: `09:30`, `18:30`
  - Short format: `9:30`, `21:30`
- Default values: 9:30 AM (Time In) and 6:30 PM (Time Out)

### 📊 Automatic Calculations
- **Minutes Late**: Calculated if arrival time is after 9:30 AM
- **Minutes Early**: Calculated if departure time is before 6:30 PM
- **Working Hours**: Total hours worked per day (Time Out - Time In)

### 💰 Bonus Rules
- **Rule 1**: Displays total minutes late and total early departures (informational)
- **Rule 2**: 
  - If total minutes late ≥ 180 minutes: Bonus = Rs0
  - Otherwise: Bonus = Rs2,500

### 💵 Pay Summary
- Basic Pay (user input)
- Bonus (automatically calculated based on attendance)
- Total Pay = Basic Pay + Bonus

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Use

1. **Enter Basic Pay**: Input your monthly basic pay amount
2. **Select Month**: Choose the month from the dropdown (Jan-Dec)
3. **Review Dates**: The app automatically generates dates from the 26th of the previous month to the 25th of the selected month
4. **Enter Times**: For each day, enter or modify:
   - Time In (default: 9:30 AM)
   - Time Out (default: 6:30 PM)
5. **View Calculations**: The app automatically calculates:
   - Minutes late (if any)
   - Minutes early (if any)
   - Working hours per day
6. **Check Summary**: View the summary section at the bottom showing:
   - Total minutes late
   - Total minutes early
   - Basic pay
   - Bonus (Rs0 or Rs2,500)
   - Total pay

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Compiler** - Enabled for optimized performance
- **Plain CSS** - Minimal styling with dark/light mode support

## Project Structure

```
src/
  ├── App.jsx      # Main application component
  ├── App.css      # Application styles
  ├── index.css    # Global styles
  └── main.jsx     # Application entry point
```

## Notes

- All calculations are performed client-side (no backend required)
- Data is stored in component state (refreshing the page will reset data)
- The application supports both light and dark color schemes based on system preferences
