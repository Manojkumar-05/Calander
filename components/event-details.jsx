"use client"

import { Clock, MapPin, FileText, Edit, Trash2, AlertTriangle } from "lucide-react"
import { eventCategories } from "../data/events"

export default function EventDetails({ event, onEdit, onDelete, hasConflict, conflictLevel }) {
  const category = eventCategories.find((cat) => cat.value === event.category)

  const addMinutesToTime = (timeString, minutes) => {
    const [hours, mins] = timeString.split(":").map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`
  }

  const getConflictStyling = () => {
    if (!hasConflict) return ""

    switch (conflictLevel) {
      case "high":
        return "ring-4 ring-red-400 bg-gradient-to-r from-red-50 to-pink-50"
      case "medium":
        return "ring-2 ring-amber-400 bg-gradient-to-r from-amber-50 to-orange-50"
      case "low":
        return "ring-1 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50"
      default:
        return "ring-2 ring-amber-400 bg-gradient-to-r from-amber-50 to-orange-50"
    }
  }

  return (
    <div
      className={`p-6 rounded-2xl border-l-4 ${category?.color || "border-gray-400"} bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${getConflictStyling()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`px-4 py-2 rounded-xl ${category?.color || 'bg-gray-500'} shadow-sm`}> 
              <h3 className="font-bold text-white text-lg">{event.title}</h3>
            </div>
            {hasConflict && (
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl ${
                  conflictLevel === "high"
                    ? "bg-red-100"
                    : conflictLevel === "medium"
                      ? "bg-amber-100"
                      : "bg-yellow-100"
                }`}>
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      conflictLevel === "high"
                        ? "text-red-600"
                        : conflictLevel === "medium"
                          ? "text-amber-600"
                          : "text-yellow-600"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    conflictLevel === "high"
                      ? "bg-red-100 text-red-700"
                      : conflictLevel === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {conflictLevel === "high"
                    ? "High Conflict"
                    : conflictLevel === "medium"
                      ? "Conflict"
                      : "Minor Conflict"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold">
                {event.time} - {addMinutesToTime(event.time, event.duration)} ({event.duration} min)
              </span>
            </div>

            {event.location && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium">{event.location}</span>
              </div>
            )}

            {event.description && (
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="bg-purple-100 p-2 rounded-lg mt-0.5">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <span className="leading-relaxed">{event.description}</span>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className={`w-4 h-4 rounded-full ${category?.color || "bg-gray-400"}`}></div>
              <span className="font-semibold capitalize">{category?.label || event.category}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-6">
          <button
            onClick={() => onEdit(event)}
            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:shadow-sm"
            title="Edit event"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-sm"
            title="Delete event"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
