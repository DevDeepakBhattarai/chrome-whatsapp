export type Contact = {
  id: string
  name: string
  phone: string
}

export const CONTACTS_STORAGE_KEY = "contacts"

export const normalizePhone = (value: string) =>
  value.replace(/[^\d]/g, "")

export const readContacts = () =>
  new Promise<Contact[]>((resolve) => {
    chrome.storage.sync.get(
      { [CONTACTS_STORAGE_KEY]: [] as Contact[] },
      (items) => {
        resolve((items[CONTACTS_STORAGE_KEY] as Contact[]) ?? [])
      }
    )
  })

export const writeContacts = (contacts: Contact[]) =>
  new Promise<void>((resolve) => {
    chrome.storage.sync.set({ [CONTACTS_STORAGE_KEY]: contacts }, () => {
      resolve()
    })
  })
