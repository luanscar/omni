import { ReactNode } from 'react'

export default function ConversationIdLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
