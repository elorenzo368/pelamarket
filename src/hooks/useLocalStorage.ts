import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para almacenar nuestro valor
  // Pasa la función inicializadora a useState para que solo se ejecute una vez
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      // Obtener del localStorage por key
      const item = window.localStorage.getItem(key)
      // Parsear el item almacenado o devolver initialValue
      const value = item ? JSON.parse(item) : initialValue
      setStoredValue(value)
    } catch (error) {
      // Si hay un error, devolver initialValue
      console.error(`Error reading localStorage key "${key}":`, error)
      setStoredValue(initialValue)
    } finally {
      setIsLoaded(true)
    }
  }, [key, initialValue])

  // Función para establecer el valor en localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Guardar en el estado
      setStoredValue(valueToStore)
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isLoaded] as const
}
