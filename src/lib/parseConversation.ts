export const parseConversation = (key: string, value: string | null) => {
  if (!value) return null
  const data = JSON.parse(value)
  data.composerId = key.split(':')[1]
  return data
}