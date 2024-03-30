const getEnvVar = (name: string): string => {
  const value = process.env[name]
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is missing`)
  }
  return value
}

export { getEnvVar }
