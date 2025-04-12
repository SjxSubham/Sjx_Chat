import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useConversation = create(
    persist(
        (set) => ({
            selectedConversation: null,
            setSelectedConversation: (selectedConversation) => {
                try {
                    set({ selectedConversation })
                } catch (error) {
                    console.error('Error setting selected conversation:', error)
                }
            },
            messages: [],
            setMessages: (messages) => {
                try {
                    set({ messages })
                } catch (error) {
                    console.error('Error setting messages:', error)
                }
            },
            addMessage: (message) => {
                try {
                    set((state) => ({ messages: [...state.messages, message] }))
                } catch (error) {
                    console.error('Error adding message:', error)
                }
            },
            clearMessages: () => {
                try {
                    set({ messages: [] })
                } catch (error) {
                    console.error('Error clearing messages:', error)
                }
            }
        }),
        {
            name: 'conversation-storage',
            partialize: (state) => ({
                selectedConversation: state.selectedConversation,
                messages: state.messages
            })
        }
    )
)

export default useConversation;
