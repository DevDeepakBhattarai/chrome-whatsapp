import { useEffect, useState } from "react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
  CONTACTS_STORAGE_KEY,
  type Contact
} from "~/lib/contacts"

import "./style.css"

function IndexPopup() {
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    chrome.storage.sync.get({ [CONTACTS_STORAGE_KEY]: [] }, (items) => {
      setContacts((items[CONTACTS_STORAGE_KEY] as Contact[]) ?? [])
    })

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "sync") return
      if (!changes[CONTACTS_STORAGE_KEY]) return
      setContacts((changes[CONTACTS_STORAGE_KEY].newValue as Contact[]) ?? [])
    }

    chrome.storage.onChanged.addListener(listener)

    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  return (
    <div className="min-w-[320px] bg-background p-4 text-foreground">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Quick Send</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select text on any page, right click, and choose a contact to send
            it on WhatsApp. The desktop app will open with the message
            prefilled.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Saved contacts</span>
            <span className="font-medium">{contacts.length}</span>
          </div>
          <Button onClick={() => chrome.runtime.openOptionsPage()}>
            Manage contacts
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default IndexPopup
