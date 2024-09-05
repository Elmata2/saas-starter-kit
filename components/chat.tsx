import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { useAuth } from '../../hooks/useAuth' // Assuming you have an auth hook

function Chat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const { user } = useAuth() // Get the current user

  useEffect(() => {
    fetchMessages()

    const subscription = supabase
      .from('messages')
      .on('INSERT', payload => {
        setMessages(current => [...current, payload.new])
      })
      .eq('room_id', roomId)
      .subscribe()

    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [roomId])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    if (error) console.error('Error fetching messages:', error)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        user_id: user.id,
        room_id: roomId
      })

    if (error) console.error('Error sending message:', error)
    else setNewMessage('')
  }

  return (
    <div>
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id}>
            <strong>{message.profiles.username}: </strong>
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default Chat
