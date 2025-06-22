import { calendar_v3 } from "googleapis";
import Calendar = calendar_v3.Schema$FreeBusyCalendar


// Function to check if a new event conflicts with busy periods (single calendar)
export function isEventAvailable(busy: NonNullable<Calendar["busy"]>, newEventStart: Date, newEventEnd: Date): boolean {
  const eventStart = new Date(newEventStart);
  const eventEnd = new Date(newEventEnd);
  
  for (const busyPeriod of busy) {
    const busyStart = new Date(busyPeriod.start);
    const busyEnd = new Date(busyPeriod.end);
    
    // Check if the new event overlaps with any busy period
    if (eventsOverlap(eventStart, eventEnd, busyStart, busyEnd)) {
      return false; // Conflict found
    }
  }
  
  return true; // No conflicts found  
}

// Helper function to check if two time periods overlap
function eventsOverlap(start1, end1, start2, end2) {
  // Two events overlap if:
  // - Event 1 starts before Event 2 ends AND
  // - Event 2 starts before Event 1 ends
  return start1 < end2 && start2 < end1;
}

// More detailed function that returns conflict information (single calendar)
export function checkEventAvailability(busy, newEventStart, newEventEnd) {
  const eventStart = new Date(newEventStart);
  const eventEnd = new Date(newEventEnd);
  const conflicts = [];
  
  
  if (busy) {
    for (const busyPeriod of busy) {
      const busyStart = new Date(busyPeriod.start);
      const busyEnd = new Date(busyPeriod.end);
      
      if (eventsOverlap(eventStart, eventEnd, busyStart, busyEnd)) {
        conflicts.push({
          conflictStart: busyStart,
          conflictEnd: busyEnd
        });
      }
    }
  }
  
  return {
    isAvailable: conflicts.length === 0,
    conflicts: conflicts
  };
}
