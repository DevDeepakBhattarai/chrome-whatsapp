import { useEffect, useMemo, useState } from "react"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import {
  CONTACTS_STORAGE_KEY,
  normalizePhone,
  readContacts,
  type Contact,
  writeContacts
} from "~/lib/contacts"

import "./style.css"

const createContactId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`

const OptionsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState("")

  const canAdd = useMemo(() => {
    return name.trim().length > 0 && normalizePhone(phone).length > 0
  }, [name, phone])

  useEffect(() => {
    let mounted = true

    readContacts()
      .then((stored) => {
        if (!mounted) return
        setContacts(stored)
      })
      .catch((error) => {
        console.error("Failed to load contacts", error)
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
      mounted = false
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  const addContact = async () => {
    if (!canAdd) {
      setStatus("Add a name and a valid phone number first.")
      return
    }

    const normalizedPhone = normalizePhone(phone)
    const newContact: Contact = {
      id: createContactId(),
      name: name.trim(),
      phone: normalizedPhone
    }

    const updated = [...contacts, newContact]
    await writeContacts(updated)
    setContacts(updated)
    setName("")
    setPhone("")
    setStatus("Contact added.")
  }

  const removeContact = async (contactId: string) => {
    const updated = contacts.filter((contact) => contact.id !== contactId)
    await writeContacts(updated)
    setContacts(updated)
    setStatus("Contact removed.")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Quick Send</CardTitle>
          <CardDescription>
              Select text on any page, right click, then choose a contact. The
              WhatsApp desktop app will open with the message prefilled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Contact name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                placeholder="Phone with country code"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={addContact} disabled={!canAdd}>
                Add contact
              </Button>
              <span className="text-xs text-muted-foreground">
                Use digits only, for example 15551234567.
              </span>
            </div>
            {status ? (
              <p className="text-sm text-muted-foreground">{status}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Contacts</CardTitle>
            <CardDescription>
              These show up under the right click menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contacts yet. Add one above.
              </p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.phone}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeContact(contact.id)}>
                    Remove
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OptionsPage
