import { calendar_v3 } from "googleapis";
import Calendar = calendar_v3.Schema$FreeBusyCalendar

// TODO: Function could be replaced with openAI function that checks availability 
// This function checks if a new event can be scheduled without conflicting with existing busy periods in a calendar.
export function isEventAvailable(busy: NonNullable<Calendar["busy"]>, newEventStart: Date, newEventEnd: Date): boolean {
  const eventStart = new Date(newEventStart);
  const eventEnd = new Date(newEventEnd);
  
  for (const busyPeriod of busy) {
    if (!busyPeriod.start || !busyPeriod.end) {
      console.warn("Busy period missing start or end time:", busyPeriod);
      continue; 
    }

    const busyStart = new Date(busyPeriod.start);
    const busyEnd = new Date(busyPeriod.end);
    
    // Check if the new event overlaps with any busy period
    if (eventsOverlap(eventStart, eventEnd, busyStart, busyEnd)) {
      return false; // Conflict found
    }
  }
  
  return true; // No conflicts found  
}

// TODO: Did not seem to work with longer busy periods, so we need to check the start and end of the new event against each busy period
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
