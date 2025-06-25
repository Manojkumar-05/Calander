"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, MapPin, FileText, AlertTriangle } from "lucide-react"
import { eventCategories } from "../data/events"
import { format } from "date-fns"

export default function EventForm({ event, selectedDate, onSave, onCancel, onDelete, conflicts = [], isDarkMode = false }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "09:00",
    duration: 60,
    category: "meeting",
    description: "",
    location: "",
  })

  const [errors, setErrors] = useState({})
  const [conflictWarning, setConflictWarning] = useState(null)

  // Initialize form data when editing or selecting date
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        date: event.date || "",
        time: event.time || "09:00",
        duration: event.duration || 60,
        category: event.category || "meeting",
        description: event.description || "",
        location: event.location || "",
      })
    } else if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: format(selectedDate, "yyyy-MM-dd"),
        title: "",
        description: "",
        location: "",
      }))
    }
  }, [event, selectedDate])

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const checkForConflicts = (formData) => {
    // This would need to be passed from parent component
    return conflicts
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    if (!formData.time) {
      newErrors.time = "Time is required"
    }

    if (formData.duration < 15) {
      newErrors.duration = "Duration must be at least 15 minutes"
    }

    // Check for conflicts
    const conflictingEvents = checkForConflicts(formData)
    if (conflictingEvents.length > 0) {
      setConflictWarning({
        events: conflictingEvents,
        message: `This event conflicts with: ${conflictingEvents.map((e) => e.title).join(", ")}`,
      })
    } else {
      setConflictWarning(null)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData) // Debug log

    if (validateForm()) {
      try {
        onSave(formData)
        console.log("Event submitted successfully") // Debug log

        // Reset form
        setFormData({
          title: "",
          date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
          time: "09:00",
          duration: 60,
          category: "meeting",
          description: "",
          location: "",
        })
        setErrors({})
        setConflictWarning(null)
        onCancel()
      } catch (error) {
        console.error("Error submitting event:", error)
      }
    }
  }

  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value) // Debug log
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      console.log("New form data:", newData) // Debug log
      return newData
    })

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Real-time conflict checking for time and duration changes
    if (field === "time" || field === "duration") {
      const updatedFormData = { ...formData, [field]: value }
      const conflicts = checkForConflicts(updatedFormData)
      if (conflicts.length > 0) {
        setConflictWarning({
          events: conflicts,
          message: `This time conflicts with: ${conflicts.map((e) => e.title).join(", ")}`,
        })
      } else {
        setConflictWarning(null)
      }
    }
  }

  const selectedCategory = eventCategories.find((cat) => cat.value === formData.category)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-100'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{event ? "Edit Event" : "Create New Event"}</h2>
          <button 
            onClick={onCancel} 
            className={`p-2 rounded-lg transition-colors duration-300 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Warning */}
        {conflictWarning && (
          <div className={`mx-6 mt-4 rounded-xl p-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-red-900/20 border border-red-700' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-xl ${
                isDarkMode ? 'bg-red-800' : 'bg-red-100'
              }`}>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-red-300' : 'text-red-800'
                }`}>Schedule Conflict</h4>
                <p className={`text-sm mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>{conflictWarning.message}</p>
                <div className="space-y-2">
                  {conflictWarning.events.map((event, index) => {
                    const categoryColor = eventCategories.find((cat) => cat.value === event.category)?.color || "bg-gray-500"
                    return (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-xl border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-red-700' 
                          : 'bg-white border-red-200'
                      }`}>
                        <div className={`w-4 h-4 rounded-full ${categoryColor}`}></div>
                        <div className="flex-1">
                          <div className={`inline-block px-3 py-1 rounded-lg ${categoryColor} bg-opacity-90`}>
                            <span className="text-white font-semibold text-sm">{event.title}</span>
                          </div>
                          <span className={`text-sm ml-2 font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {event.time}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Event Title *</label>
            <div className={`relative rounded-xl overflow-hidden ${selectedCategory?.color || 'bg-gray-500'} bg-opacity-10`}>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full px-4 py-3 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-white placeholder-gray-400' 
                    : 'text-gray-900 placeholder-gray-500'
                } ${errors.title ? "ring-2 ring-red-500" : ""}`}
                placeholder="Enter event title"
              />
              <div className={`absolute inset-0 pointer-events-none ${selectedCategory?.color || 'bg-gray-500'} bg-opacity-5`}></div>
            </div>
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.date ? "border-red-500" : ""}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Clock className="w-4 h-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-900'
                } ${errors.time ? "border-red-500" : ""}`}
              />
              {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Duration and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Duration (minutes) *</label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", Number.parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {eventCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter location (optional)"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Enter event description (optional)"
            />
          </div>

          {/* Category Preview */}
          {selectedCategory && (
            <div className={`flex items-center space-x-3 p-4 rounded-xl ${selectedCategory.color} bg-opacity-10 border transition-colors duration-300 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <div className={`w-6 h-6 rounded-full ${selectedCategory.color} shadow-sm`}></div>
              <div className="flex-1">
                <span className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  This event will appear as: 
                </span>
                <div className={`inline-block px-3 py-1 rounded-lg ${selectedCategory.color} bg-opacity-90 ml-2`}>
                  <span className="text-white font-bold text-sm">{selectedCategory.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className={`flex justify-end space-x-3 pt-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {onDelete && event && (
              <button
                type="button"
                onClick={onDelete}
                className="px-6 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className={`px-6 py-2 rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg transition-colors ${
                conflictWarning ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {conflictWarning ? "Create Anyway" : event ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
