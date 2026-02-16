import { useState, useMemo, useEffect } from 'react'
import './App.css'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const STATUS_OPTIONS = [
  { value: 'working', label: 'Working' },
  { value: 'leave', label: 'Leave' },
  { value: 'off', label: 'Off' }
]

// Parse flexible time formats (9:30 AM, 09:30, 9:30, 21:30, etc.)
function parseTime(timeString) {
  if (!timeString || !timeString.trim()) return null
  
  const trimmed = timeString.trim().toUpperCase()
  
  // Try to parse as 24-hour format first (HH:MM or H:MM)
  const time24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (time24Match) {
    const hours = parseInt(time24Match[1], 10)
    const minutes = parseInt(time24Match[2], 10)
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes, totalMinutes: hours * 60 + minutes }
    }
  }
  
  // Try to parse as 12-hour format (H:MM AM/PM or HH:MM AM/PM)
  const time12Match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (time12Match) {
    let hours = parseInt(time12Match[1], 10)
    const minutes = parseInt(time12Match[2], 10)
    const period = time12Match[3]
    
    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes < 60) {
      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }
      return { hours, minutes, totalMinutes: hours * 60 + minutes }
    }
  }
  
  return null
}

// Check if a date is a weekend (Saturday or Sunday)
function isWeekend(date) {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday
}

// Generate date range from 26th of previous month to 25th of selected month
function generateDateRange(selectedMonth) {
  const monthIndex = MONTHS.indexOf(selectedMonth)
  if (monthIndex === -1) return []
  
  const currentYear = new Date().getFullYear()
  const dates = []
  
  // Calculate previous month
  let prevMonthIndex = monthIndex - 1
  let year = currentYear
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11
    year = currentYear - 1
  }
  
  // Start from 26th of previous month
  const startDate = new Date(year, prevMonthIndex, 26)
  
  // End at 25th of selected month
  const endDate = new Date(currentYear, monthIndex, 25)
  
  // Generate all dates in range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

function App() {
  const [basicPay, setBasicPay] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateEntries, setDateEntries] = useState({})

  // Generate dates when month is selected
  const dates = useMemo(() => {
    if (!selectedMonth) return []
    return generateDateRange(selectedMonth)
  }, [selectedMonth])

  // Initialize date entries with defaults when dates change
  useEffect(() => {
    if (dates.length > 0) {
      setDateEntries(prevEntries => {
        const newEntries = { ...prevEntries }
        dates.forEach(date => {
          const dateKey = date.toISOString().split('T')[0]
          if (!newEntries[dateKey]) {
            // Automatically set weekends as 'off', others as 'working'
            const status = isWeekend(date) ? 'off' : 'working'
            newEntries[dateKey] = {
              timeIn: '9:30 AM',
              timeOut: '6:30 PM',
              status: status
            }
          } else {
            // Ensure existing entries have status field, preserve existing status unless it's a weekend
            if (!newEntries[dateKey].status) {
              newEntries[dateKey].status = isWeekend(date) ? 'off' : 'working'
            } else if (isWeekend(date) && newEntries[dateKey].status !== 'off') {
              // Force weekends to be 'off'
              newEntries[dateKey].status = 'off'
            }
          }
        })
        return newEntries
      })
    }
  }, [dates])

  // Update time entry
  const updateTimeEntry = (dateKey, field, value) => {
    setDateEntries(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [field]: value
      }
    }))
  }

  // Update status entry
  const updateStatus = (dateKey, status) => {
    setDateEntries(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        status: status
      }
    }))
  }

  // Calculate metrics for a single day
  const calculateDayMetrics = (dateKey) => {
    const entry = dateEntries[dateKey]
    if (!entry) return { minutesLate: 0, minutesEarly: 0, workingHours: 0 }

    // Skip calculations for 'off' and 'leave' days
    if (entry.status === 'off' || entry.status === 'leave') {
      return { minutesLate: 0, minutesEarly: 0, workingHours: 0 }
    }

    const timeIn = parseTime(entry.timeIn)
    const timeOut = parseTime(entry.timeOut)

    if (!timeIn || !timeOut) {
      return { minutesLate: 0, minutesEarly: 0, workingHours: 0 }
    }

    // Expected times in minutes
    const expectedTimeIn = 9 * 60 + 30 // 9:30 AM
    const expectedTimeOut = 18 * 60 + 30 // 6:30 PM

    // Calculate minutes late
    const minutesLate = timeIn.totalMinutes > expectedTimeIn 
      ? timeIn.totalMinutes - expectedTimeIn 
      : 0

    // Calculate minutes early
    const minutesEarly = timeOut.totalMinutes < expectedTimeOut 
      ? expectedTimeOut - timeOut.totalMinutes 
      : 0

    // Calculate working hours
    let workingMinutes = timeOut.totalMinutes - timeIn.totalMinutes
    if (workingMinutes < 0) {
      workingMinutes = 0 // Handle edge case where time out is before time in
    }
    const workingHours = workingMinutes / 60

    return { minutesLate, minutesEarly, workingHours }
  }

  // Calculate totals
  const totals = useMemo(() => {
    let totalMinutesLate = 0
    let totalMinutesEarly = 0
    let leaveCount = 0

    dates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0]
      const entry = dateEntries[dateKey]
      
      // Count leave days (excluding weekends)
      if (entry && entry.status === 'leave' && !isWeekend(date)) {
        leaveCount++
      }
      
      // Only calculate attendance metrics for working days
      if (entry && entry.status === 'working') {
        const metrics = calculateDayMetrics(dateKey)
        totalMinutesLate += metrics.minutesLate
        totalMinutesEarly += metrics.minutesEarly
      }
    })

    // Attendance bonus: if total minutes late >= 180, bonus = 0, otherwise 2500
    const attendanceBonus = totalMinutesLate >= 180 ? 0 : 2500

    // No leave bonus: if leaveCount === 0, bonus = 2500, otherwise 0
    const noLeaveBonus = leaveCount === 0 ? 2500 : 0

    // Total bonus is sum of both bonuses
    const totalBonus = attendanceBonus + noLeaveBonus

    // Leave deduction: first leave is free, each additional leave deducts Basic Pay / 30
    const basicPayNum = parseFloat(basicPay) || 0
    const leaveDeduction = Math.max(0, (leaveCount - 1)) * (basicPayNum / 30)
    const totalPay = basicPayNum + totalBonus - leaveDeduction

    return {
      totalMinutesLate,
      totalMinutesEarly,
      attendanceBonus,
      noLeaveBonus,
      totalBonus,
      leaveCount,
      leaveDeduction,
      totalPay
    }
  }, [dates, dateEntries, basicPay])

  return (
    <div className="app">
      <h1>Time Tracking & Pay Calculator</h1>
      
      <div className="input-section">
        <div className="input-group">
          <label htmlFor="basic-pay">Basic Pay:</label>
          <input
            id="basic-pay"
            type="number"
            value={basicPay}
            onChange={(e) => setBasicPay(e.target.value)}
            placeholder="Enter basic pay"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="month">Month:</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Select Month</option>
            {MONTHS.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {dates.length > 0 && (
        <>
          <div className="info-text">
            <p>Working period: 26th of previous month to 25th of selected month</p>
            <p>Expected: Time In = 9:30 AM, Time Out = 6:30 PM</p>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Minutes Late</th>
                  <th>Minutes Early</th>
                  <th>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {dates.map(date => {
                  const dateKey = date.toISOString().split('T')[0]
                  const entry = dateEntries[dateKey] || { 
                    timeIn: '9:30 AM', 
                    timeOut: '6:30 PM',
                    status: isWeekend(date) ? 'off' : 'working'
                  }
                  const metrics = calculateDayMetrics(dateKey)
                  const dateStr = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })
                  const isWeekendDay = isWeekend(date)
                  const status = entry.status || (isWeekendDay ? 'off' : 'working')

                  return (
                    <tr key={dateKey} className={isWeekendDay ? 'weekend-row' : ''}>
                      <td>{dateStr}</td>
                      <td>
                        <select
                          value={status}
                          onChange={(e) => updateStatus(dateKey, e.target.value)}
                          disabled={isWeekendDay}
                          className={isWeekendDay ? 'disabled-select' : ''}
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entry.timeIn}
                          onChange={(e) => updateTimeEntry(dateKey, 'timeIn', e.target.value)}
                          placeholder="9:30 AM"
                          disabled={status !== 'working'}
                          className={status !== 'working' ? 'disabled-input' : ''}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={entry.timeOut}
                          onChange={(e) => updateTimeEntry(dateKey, 'timeOut', e.target.value)}
                          placeholder="6:30 PM"
                          disabled={status !== 'working'}
                          className={status !== 'working' ? 'disabled-input' : ''}
                        />
                      </td>
                      <td className={metrics.minutesLate > 0 ? 'late' : ''}>
                        {metrics.minutesLate > 0 ? metrics.minutesLate : '-'}
                      </td>
                      <td className={metrics.minutesEarly > 0 ? 'early' : ''}>
                        {metrics.minutesEarly > 0 ? metrics.minutesEarly : '-'}
                      </td>
                      <td>{metrics.workingHours.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="summary-section">
            <h2>Summary</h2>
            <div className="summary-info">
              <p><strong>Total Minutes Late:</strong> {totals.totalMinutesLate} minutes</p>
              <p><strong>Total Minutes Early:</strong> {totals.totalMinutesEarly} minutes</p>
              <p><strong>Leave Days:</strong> {totals.leaveCount} {totals.leaveCount === 1 ? 'day' : 'days'} {totals.leaveCount > 0 && `(1 paid leave allowed, ${Math.max(0, totals.leaveCount - 1)} additional ${Math.max(0, totals.leaveCount - 1) === 1 ? 'leave' : 'leaves'} charged)`}</p>
            </div>
            <div className="summary-pay">
              <div className="pay-row">
                <span>Basic Pay:</span>
                <span>Rs{parseFloat(basicPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {totals.attendanceBonus > 0 && (
                <div className="pay-row">
                  <span>Attendance Bonus:</span>
                  <span>Rs{totals.attendanceBonus.toLocaleString('en-IN')}</span>
                </div>
              )}
              {totals.noLeaveBonus > 0 && (
                <div className="pay-row">
                  <span>No Leave Bonus:</span>
                  <span>Rs{totals.noLeaveBonus.toLocaleString('en-IN')}</span>
                </div>
              )}
              {totals.totalBonus > 0 && (
                <div className="pay-row bonus-total">
                  <span>Total Bonus:</span>
                  <span>Rs{totals.totalBonus.toLocaleString('en-IN')}</span>
                </div>
              )}
              {totals.leaveDeduction > 0 && (
                <div className="pay-row deduction">
                  <span>Leave Deduction:</span>
                  <span>-Rs{totals.leaveDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pay-row total">
                <span>Total Pay:</span>
                <span>Rs{totals.totalPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
