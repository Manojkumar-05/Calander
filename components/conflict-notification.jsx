"use client"

import { AlertTriangle, X } from "lucide-react"
import { eventCategories } from "../data/events"

export default function ConflictNotification({ conflicts, onClose, onResolve, isDarkMode = false }) {
  if (!conflicts || conflicts.length === 0) return null

  const addMinutesToTime = (timeString, minutes) => {
    const [hours, mins] = timeString.split(":").map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md">
      <div className={`border-l-4 border-red-500 rounded-2xl shadow-2xl p-6 animate-slide-in border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-red-900' : 'bg-red-100'
            }`}>
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-lg mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Schedule Conflict Detected!</h4>
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div key={index} className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <div className={`font-bold mb-2 text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-red-400' : 'text-red-700'
                    }`}>
                      {conflict.date} - {conflicts.length} conflicting events:
                    </div>
                    <div className="space-y-2">
                      {conflict.events.map((event, eventIndex) => {
                        const categoryColor = eventCategories.find((cat) => cat.value === event.category)?.color || "bg-gray-500"
                        return (
                          <div key={eventIndex} className={`flex items-center space-x-3 ml-4 p-3 rounded-xl transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <div className={`w-4 h-4 rounded-full ${categoryColor}`}></div>
                            <div className="flex-1">
                              <span className={`text-sm font-semibold transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {event.time} - {addMinutesToTime(event.time, event.duration)}: {event.title}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={onResolve}
                  className={`flex-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-red-900 text-red-300 hover:bg-red-800' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Resolve Conflicts
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-all duration-200 ml-2 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
