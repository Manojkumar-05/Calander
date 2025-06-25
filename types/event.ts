export interface Event {
  id: number
  title: string
  date: string
  time: string
  duration: number
  color: string
  category: string
  description?: string
  location?: string
  attendees?: string[]
}

export interface EventFormData {
  title: string
  date: string
  time: string
  duration: number
  category: string
  description: string
  location: string
}

export interface EventConflict {
  hasConflict: boolean
  conflictingEvents: Event[]
  conflictType: "overlap" | "adjacent" | "none"
}
