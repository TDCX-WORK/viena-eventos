import { useState } from 'react'
import RoomSelector from './components/RoomSelector/RoomSelector'
import BookingWizard from './components/BookingWizard/BookingWizard'
import { hotel } from './config/hotels/suitesviena'

export default function App() {
  const [selectedRoom, setSelectedRoom] = useState(null)

  return (
    <main style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {!selectedRoom ? (
        <RoomSelector
          hotel={hotel}
          onSelectRoom={setSelectedRoom}
        />
      ) : (
        <BookingWizard
          hotel={hotel}
          room={selectedRoom}
          onBack={() => setSelectedRoom(null)}
        />
      )}
    </main>
  )
}