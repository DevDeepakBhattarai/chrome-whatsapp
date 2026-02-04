import {
  CONTACTS_STORAGE_KEY,
  normalizePhone,
  readContacts,
  type Contact
} from "~/lib/contacts"

const MENU_ROOT_ID = "whatsapp-send-root"
const MENU_MANAGE_ID = "whatsapp-manage"
const MENU_EMPTY_ID = "whatsapp-empty"
const MENU_CONTACT_PREFIX = "whatsapp-contact-"
const MENU_CONTEXTS: chrome.contextMenus.ContextType[] = [
  "selection",
  "page",
  "editable"
]

const removeAllContextMenus = () =>
  new Promise<void>((resolve) => {
    chrome.contextMenus.removeAll(() => resolve())
  })

const buildWhatsAppUrl = (phone: string, message: string) => {
  const normalized = normalizePhone(phone)
  const encodedText = encodeURIComponent(message || "")
  return `whatsapp://send?phone=${normalized}&text=${encodedText}`
}

const createContextMenus = async () => {
  await removeAllContextMenus()

  chrome.contextMenus.create({
    id: MENU_ROOT_ID,
    title: "Send to WhatsApp",
    contexts: MENU_CONTEXTS
  })

  const contacts = await readContacts()

  if (contacts.length === 0) {
    chrome.contextMenus.create({
      id: MENU_EMPTY_ID,
      parentId: MENU_ROOT_ID,
      title: "No contacts yet",
      enabled: false,
      contexts: MENU_CONTEXTS
    })
  } else {
    contacts.forEach((contact) => {
      chrome.contextMenus.create({
        id: `${MENU_CONTACT_PREFIX}${contact.id}`,
        parentId: MENU_ROOT_ID,
        title: contact.name,
        contexts: MENU_CONTEXTS
      })
    })
  }

  chrome.contextMenus.create({
    id: MENU_MANAGE_ID,
    parentId: MENU_ROOT_ID,
    title: "Manage contacts...",
    contexts: MENU_CONTEXTS
  })
}

const findContactByMenuId = async (menuItemId: string) => {
  if (!menuItemId.startsWith(MENU_CONTACT_PREFIX)) return null
  const contactId = menuItemId.replace(MENU_CONTACT_PREFIX, "")
  const contacts = await readContacts()
  return contacts.find((contact) => contact.id === contactId) ?? null
}

const openWhatsAppMessage = (contact: Contact, message: string) => {
  const url = buildWhatsAppUrl(contact.phone, message)
  chrome.tabs.create({ url })
}

const refreshMenus = () => {
  createContextMenus().catch((error) => {
    console.error("Failed to create context menus", error)
  })
}

chrome.runtime.onInstalled.addListener(() => {
  refreshMenus()
})

chrome.runtime.onStartup.addListener(() => {
  refreshMenus()
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return
  if (!changes[CONTACTS_STORAGE_KEY]) return
  refreshMenus()
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === MENU_MANAGE_ID) {
    chrome.runtime.openOptionsPage()
    return
  }

  const menuItemId = String(info.menuItemId)
  const contact = await findContactByMenuId(menuItemId)
  if (!contact) return

  const selectedText = info.selectionText?.trim() ?? ""
  const message = selectedText || info.pageUrl || ""
  openWhatsAppMessage(contact, message)
})
