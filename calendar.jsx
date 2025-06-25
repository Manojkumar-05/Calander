"use client"

import { useState, useMemo, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Search, Filter, AlertTriangle, Bell, X, Calendar as CalendarIcon, Trash2, Eye, Moon, Sun } from "lucide-react"
import { initialEvents, eventCategories } from "./data/events"
import EventForm from "./components/event-form"
import EventDetails from "./components/event-details"
import ConflictNotification from "./components/conflict-notification"

// ─── Time Helpers ───────────────────────────────────────────────────────────────
/**
 * Convert a "HH:MM" string into total minutes.
 * @param {string} time
 * @returns {number}
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Add minutes to a "HH:MM" string and return the resulting "HH:MM".
 * @param {string} timeString
 * @param {number} minutes
 * @returns {string}
 */
function addMinutesToTime(timeString, minutes) {
  const [hours, mins] = timeString.split(":").map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`
}
// ────────────────────────────────────────────────────────────────────────────────

// Local Storage Functions
const saveEventsToStorage = (events) => {
  try {
    localStorage.setItem('calendarEvents', JSON.stringify(events))
  } catch (error) {
    console.error('Error saving events to localStorage:', error)
  }
}

const loadEventsFromStorage = () => {
  try {
    const storedEvents = localStorage.getItem('calendarEvents')
    if (storedEvents) {
      return JSON.parse(storedEvents)
    }
  } catch (error) {
    console.error('Error loading events from localStorage:', error)
  }
  return initialEvents
}

const saveThemeToStorage = (theme) => {
  try {
    localStorage.setItem('calendarTheme', theme)
  } catch (error) {
    console.error('Error saving theme to localStorage:', error)
  }
}

const loadThemeFromStorage = () => {
  try {
    return localStorage.getItem('calendarTheme') || 'light'
  } catch (error) {
    console.error('Error loading theme from localStorage:', error)
    return 'light'
  }
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [events, setEvents] = useState(() => loadEventsFromStorage())
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [conflictNotifications, setConflictNotifications] = useState([])
  const [showConflictNotification, setShowConflictNotification] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [modalDate, setModalDate] = useState(null)
  const [selectedDateInput, setSelectedDateInput] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(() => loadThemeFromStorage() === 'dark')

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    saveThemeToStorage(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Get calendar dates for the current month
  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    })
  }, [currentDate])

  // Filter events based on search and category
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" || event.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [events, searchTerm, selectedCategory])

  // Check for conflicts across all events
  const allConflicts = useMemo(() => {
    const conflictsByDate = {}

    // Group events by date
    const eventsByDate = {}
    events.forEach((event) => {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = []
      }
      eventsByDate[event.date].push(event)
    })

    // Check for conflicts in each date
    Object.keys(eventsByDate).forEach((date) => {
      const dayEvents = eventsByDate[date].sort((a, b) => a.time.localeCompare(b.time))
      const conflicts = []

      for (let i = 0; i < dayEvents.length - 1; i++) {
        const currentEvent = dayEvents[i]
        const nextEvent = dayEvents[i + 1]

        const currentEndTime = addMinutesToTime(currentEvent.time, currentEvent.duration)
        const nextStartTime = nextEvent.time

        if (nextStartTime < currentEndTime) {
          conflicts.push({
            date,
            events: [currentEvent, nextEvent],
            overlapMinutes: timeToMinutes(currentEndTime) - timeToMinutes(nextStartTime),
          })
        }
      }

      if (conflicts.length > 0) {
        conflictsByDate[date] = conflicts
      }
    })

    return conflictsByDate
  }, [events])

  // Update conflict notifications when conflicts change
  useEffect(() => {
    const conflictArray = Object.values(allConflicts).flat()
    if (conflictArray.length > 0 && hasUserInteracted) {
      setConflictNotifications(conflictArray)
      setShowConflictNotification(true)
    } else {
      setConflictNotifications([])
      setShowConflictNotification(false)
    }
  }, [allConflicts, hasUserInteracted])

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateString = format(date, "yyyy-MM-dd")
    return filteredEvents.filter((event) => event.date === dateString)
  }

  // Enhanced conflict detection with severity levels
  const checkEventConflicts = (events) => {
    if (events.length <= 1) {
      return { hasConflict: false, conflictingEvents: [], conflictType: "none", severity: "none" }
    }

    const sortedEvents = events.sort((a, b) => a.time.localeCompare(b.time))
    const conflictingEvents = []
    let conflictType = "none"
    let maxOverlap = 0

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i]
      const nextEvent = sortedEvents[i + 1]

      const currentEndTime = addMinutesToTime(currentEvent.time, currentEvent.duration)
      const nextStartTime = nextEvent.time

      if (nextStartTime < currentEndTime) {
        conflictType = "overlap"
        const overlapMinutes = timeToMinutes(currentEndTime) - timeToMinutes(nextStartTime)
        maxOverlap = Math.max(maxOverlap, overlapMinutes)

        if (!conflictingEvents.includes(currentEvent)) {
          conflictingEvents.push(currentEvent)
        }
        if (!conflictingEvents.includes(nextEvent)) {
          conflictingEvents.push(nextEvent)
        }
      } else if (nextStartTime === currentEndTime && conflictType === "none") {
        conflictType = "adjacent"
      }
    }

    // Determine severity based on overlap duration
    let severity = "none"
    if (maxOverlap > 0) {
      if (maxOverlap >= 60) severity = "high"
      else if (maxOverlap >= 30) severity = "medium"
      else severity = "low"
    }

    return {
      hasConflict: conflictingEvents.length > 0,
      conflictingEvents,
      conflictType,
      severity,
      maxOverlap,
    }
  }

  // Get conflict level for individual events
  const getEventConflictLevel = (event, dayEvents) => {
    const conflicts = dayEvents.filter((otherEvent) => {
      if (otherEvent.id === event.id) return false
      return checkEventConflicts([event, otherEvent]).hasConflict
    })
    return conflicts.length > 0 ? "high" : null
  }

  const getEventConflicts = (event) => {
    const dayEvents = getEventsForDate(event.date)
    return dayEvents.filter((otherEvent) => {
      if (otherEvent.id === event.id) return false
      return checkEventConflicts([event, otherEvent]).hasConflict
    })
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Event management functions
  const handleCreateEvent = (eventData) => {
    setHasUserInteracted(true)
    console.log("Creating event with data:", eventData) // Debug log

    const newEvent = {
      id: Date.now() + Math.random(), // Ensure unique ID
      ...eventData,
      color: eventCategories.find((cat) => cat.value === eventData.category)?.color || "bg-gray-500",
    }

    console.log("New event created:", newEvent) // Debug log

    setEvents((prevEvents) => {
      const updatedEvents = [...prevEvents, newEvent]
      console.log("Updated events array:", updatedEvents) // Debug log
      saveEventsToStorage(updatedEvents)
      return updatedEvents
    })
  }

  const handleEditEvent = (eventData) => {
    setHasUserInteracted(true)
    if (!editingEvent) return

    console.log("Editing event with data:", eventData) // Debug log

    const updatedEvent = {
      ...editingEvent,
      ...eventData,
      color: eventCategories.find((cat) => cat.value === eventData.category)?.color || "bg-gray-500",
    }

    setEvents((prevEvents) => {
      const updatedEvents = prevEvents.map((event) => (event.id === editingEvent.id ? updatedEvent : event))
      console.log("Updated events after edit:", updatedEvents) // Debug log
      saveEventsToStorage(updatedEvents)
      return updatedEvents
    })
    setEditingEvent(null)
  }

  const handleDeleteEvent = (eventId) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents((prevEvents) => {
        const updatedEvents = prevEvents.filter((event) => event.id !== eventId)
        saveEventsToStorage(updatedEvents)
        return updatedEvents
      })
    }
  }

  const openCreateEventForm = (date) => {
    setEditingEvent(null)
    if (date) setSelectedDate(date)
    setIsEventFormOpen(true)
  }

  const openEditEventForm = (event) => {
    setEditingEvent(event)
    setIsEventFormOpen(true)
  }

  const resolveConflicts = () => {
    setSelectedDate(new Date())
    setShowConflictNotification(false)
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setModalDate(date)
    setShowEventModal(true)
  }

  const handleDateSelect = (dateString) => {
    if (dateString) {
      const newDate = new Date(dateString)
      setCurrentDate(newDate)
      setSelectedDate(newDate)
      setSelectedDateInput(dateString)
    }
  }

  const clearAllEvents = () => {
    if (confirm("Are you sure you want to clear all events? This action cannot be undone.")) {
      setEvents(initialEvents)
      saveEventsToStorage(initialEvents)
      setHasUserInteracted(false)
    }
  }

  // Save events to localStorage whenever they change
  useEffect(() => {
    saveEventsToStorage(events)
  }, [events])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleViewEvents = (date, e) => {
    e.stopPropagation()
    handleDateClick(date)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Conflict Notifications */}
      {showConflictNotification && (
        <ConflictNotification
          conflicts={conflictNotifications}
          onClose={() => setShowConflictNotification(false)}
          onResolve={resolveConflicts}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className={`rounded-2xl shadow-lg border p-8 mb-8 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-4xl font-bold transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                  }`}>
                    {format(currentDate, "MMMM yyyy")}
                  </h1>
                  <p className={`text-sm mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Calendar & Event Management</p>
                </div>
              </div>
              
              {/* Date Picker */}
              <div className="relative">
                <CalendarIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="date"
                  value={selectedDateInput}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className={`pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                      : 'bg-gray-50 border-gray-200 hover:bg-white'
                  }`}
                />
              </div>
              
              <button
                onClick={goToToday}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 border ${
                  isDarkMode 
                    ? 'text-blue-400 bg-blue-900/20 border-blue-700 hover:bg-blue-900/30' 
                    : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                }`}
              >
                Today
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {Object.keys(allConflicts).length > 0 && (
              <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-red-900/50 to-pink-900/50 text-red-400 border-red-700' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200'
              }`}>
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-red-800' : 'bg-red-100'
                }`}>
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-semibold">
                  {Object.keys(allConflicts).length} conflict{Object.keys(allConflicts).length > 1 ? "s" : ""} detected
                </span>
              </div>
            )}
          </div>

          <div className={`flex flex-col lg:flex-row items-stretch lg:items-center space-y-4 lg:space-y-0 lg:space-x-6 mt-8 pt-8 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600' 
                    : 'bg-gray-50 border-gray-200 hover:bg-white'
                }`}
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`pl-12 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-gray-50 border-gray-200 hover:bg-white'
                }`}
              >
                <option value="all">All Categories</option>
                {eventCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation */}
            <div className={`flex items-center space-x-2 rounded-xl p-1 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <button 
                onClick={goToPreviousMonth} 
                className={`p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${
                  isDarkMode 
                    ? 'hover:bg-gray-600 text-gray-300' 
                    : 'hover:bg-white text-gray-600'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={goToNextMonth} 
                className={`p-3 rounded-lg transition-all duration-200 hover:shadow-sm ${
                  isDarkMode 
                    ? 'hover:bg-gray-600 text-gray-300' 
                    : 'hover:bg-white text-gray-600'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Create Event Button */}
            <button
              onClick={() => openCreateEventForm(selectedDate || new Date())}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">New Event</span>
            </button>

            {/* Clear Events Button */}
            <button
              onClick={clearAllEvents}
              className="flex items-center space-x-3 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              title="Clear all events"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-semibold">Clear All</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`rounded-2xl shadow-lg border overflow-hidden transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          {/* Days of week header */}
          <div className={`grid grid-cols-7 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-700 to-gray-800' 
              : 'bg-gradient-to-r from-gray-50 to-blue-50'
          }`}>
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
              <div
                key={day}
                className={`p-6 text-center text-sm font-bold border-r border-b transition-colors duration-300 last:border-r-0 ${
                  isDarkMode 
                    ? 'text-gray-300 border-gray-600' 
                    : 'text-gray-700 border-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar dates */}
          <div className="grid grid-cols-7">
            {calendarDates.map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const eventConflicts = checkEventConflicts(dayEvents)
              const isCurrentMonth = isSameMonth(date, currentDate)
              const isCurrentDay = isToday(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const dateString = format(date, "yyyy-MM-dd")
              const hasDateConflicts = allConflicts[dateString]

              return (
                <div
                  key={index}
                  className={`min-h-[160px] p-3 border-r border-b last:border-r-0 cursor-pointer transition-all duration-300 ${
                    isDarkMode 
                      ? `${
                          isCurrentMonth 
                            ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' 
                            : 'bg-gray-900 text-gray-500 hover:bg-gray-800 border-gray-800'
                        } ${isSelected ? 'bg-blue-900/30 ring-2 ring-blue-500 shadow-inner' : ''} ${hasDateConflicts ? 'bg-red-900/20' : ''}`
                      : `${
                          isCurrentMonth 
                            ? 'bg-white hover:bg-blue-50 border-gray-100' 
                            : 'bg-gray-25 text-gray-400 hover:bg-gray-100 border-gray-100'
                        } ${isSelected ? 'bg-blue-50 ring-2 ring-blue-200 shadow-inner' : ''} ${hasDateConflicts ? 'bg-red-25' : ''}`
                  }`}
                  onClick={() => handleDateClick(date)}
                  onDoubleClick={() => openCreateEventForm(date)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-sm font-bold ${
                        isCurrentDay
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg"
                          : isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      {format(date, "d")}
                    </span>
                    <div className="flex items-center space-x-1">
                      {eventConflicts.hasConflict && (
                        <div className={`p-1 rounded-full ${
                          isDarkMode ? 'bg-red-800' : 'bg-red-100'
                        }`}>
                          <AlertTriangle
                            className={`w-4 h-4 ${
                              eventConflicts.severity === "high"
                                ? "text-red-400"
                                : eventConflicts.severity === "medium"
                                  ? "text-amber-400"
                                  : "text-yellow-400"
                            }`}
                          />
                        </div>
                      )}
                      {dayEvents.length > 0 && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            eventConflicts.hasConflict 
                              ? isDarkMode ? 'bg-red-800 text-red-300' : 'bg-red-100 text-red-700'
                              : isDarkMode ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {dayEvents.length}
                        </span>
                      )}
                      {/* View Events Button */}
                      {dayEvents.length > 0 && (
                        <button
                          onClick={(e) => handleViewEvents(date, e)}
                          className={`p-1 rounded-lg transition-all duration-200 hover:shadow-sm ${
                            isDarkMode 
                              ? 'hover:bg-gray-600 text-gray-400 hover:text-blue-400' 
                              : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                          }`}
                          title="View events for this day"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-2">
                    {dayEvents.slice(0, 3).map((event) => {
                      const conflictLevel = getEventConflictLevel(event, dayEvents)
                      const categoryColor = eventCategories.find((cat) => cat.value === event.category)?.color || "bg-gray-500"
                      return (
                        <div
                          key={event.id}
                          className={`text-xs rounded-lg overflow-hidden shadow-sm ${conflictLevel
                            ? `ring-2 ${
                                conflictLevel === "high"
                                  ? "ring-red-400"
                                  : conflictLevel === "medium"
                                    ? "ring-amber-400"
                                    : "ring-yellow-400"
                              } ring-opacity-75`
                            : ""
                          } hover:shadow-md transition-all duration-200 ${conflictLevel ? "animate-pulse" : ""}`}
                          title={`${event.title} - ${event.time} (${event.duration}min)${
                            conflictLevel ? ` - ${conflictLevel.toUpperCase()} CONFLICT` : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDate(date)
                          }}
                        >
                          <div className={`flex items-center space-x-2 px-3 py-2 ${categoryColor} bg-opacity-90`}>
                            <span className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>{event.time}</span>
                            <span className={`truncate font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{event.title}</span>
                            {conflictLevel && <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-black'}`} />}
                          </div>
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className={`text-xs font-semibold pl-2 py-1 rounded-lg transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'
                      }`}>
                        +{dayEvents.length - 3} more events
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && modalDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <div>
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Events for {format(modalDate, "EEEE, MMMM d, yyyy")}
                </h2>
                <p className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {getEventsForDate(modalDate).length} event{getEventsForDate(modalDate).length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => openCreateEventForm(modalDate)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-semibold">Add Event</span>
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {getEventsForDate(modalDate).length === 0 ? (
                <div className={`text-center py-12 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No events scheduled</p>
                  <p className="text-sm">Click "Add Event" to schedule something for this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getEventsForDate(modalDate).map((event) => {
                    const conflictLevel = getEventConflictLevel(event, getEventsForDate(modalDate))
                    const categoryColor = eventCategories.find((cat) => cat.value === event.category)?.color || "bg-gray-500"
                    return (
                      <div
                        key={event.id}
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                            : 'bg-gray-50 border-gray-200 hover:bg-white'
                        } ${conflictLevel ? `ring-2 ${
                          conflictLevel === "high"
                            ? "ring-red-400"
                            : conflictLevel === "medium"
                              ? "ring-amber-400"
                              : "ring-yellow-400"
                        } ring-opacity-75` : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColor} text-white`}>
                                {eventCategories.find((cat) => cat.value === event.category)?.label || "Other"}
                              </div>
                              {conflictLevel && (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                  conflictLevel === "high"
                                    ? isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"
                                    : conflictLevel === "medium"
                                      ? isDarkMode ? "bg-amber-900 text-amber-300" : "bg-amber-100 text-amber-700"
                                      : isDarkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{conflictLevel.toUpperCase()} CONFLICT</span>
                                </div>
                              )}
                            </div>
                            <h3 className={`text-lg font-bold mb-1 transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {event.title}
                            </h3>
                            <div className={`space-y-1 text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <p className="flex items-center space-x-2">
                                <span className="font-semibold">Time:</span>
                                <span>{event.time} ({event.duration} minutes)</span>
                              </p>
                              {event.description && (
                                <p className="flex items-start space-x-2">
                                  <span className="font-semibold">Description:</span>
                                  <span>{event.description}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => openEditEventForm(event)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                isDarkMode 
                                  ? 'hover:bg-gray-600 text-gray-400 hover:text-blue-400' 
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                              }`}
                              title="Edit event"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                isDarkMode 
                                  ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400' 
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                              }`}
                              title="Delete event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {isEventFormOpen && (
        <EventForm
          event={editingEvent}
          selectedDate={selectedDate}
          onSave={editingEvent ? handleEditEvent : handleCreateEvent}
          onCancel={() => {
            setIsEventFormOpen(false)
            setEditingEvent(null)
          }}
          onDelete={editingEvent ? () => deleteEvent(editingEvent.id) : null}
          conflicts={editingEvent ? getEventConflicts(editingEvent) : []}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
