def turkish_upper(text: str) -> str:
    """
    Converts a string to uppercase, handling Turkish 'i' -> 'İ' and 'ı' -> 'I' correctly.
    """
    if not text:
        return text
    
    mapping = {
        'i': 'İ',
        'ı': 'I'
    }
    
    # Process modifications
    result = []
    for char in text:
        if char in mapping:
            result.append(mapping[char])
        else:
            result.append(char.upper())
            
    return "".join(result)

def turkish_lower(text: str) -> str:
    """
    Converts a string to lowercase, handling Turkish 'İ' -> 'i' and 'I' -> 'ı' correctly.
    Note: 'I' -> 'ı' is tricky because in English 'I' -> 'i'.
    We will assume standard Turkish behavior where 'I' becomes 'ı'.
    However, if the text is English, 'I' should be 'i'.
    Ideally, this depends on the locale, but for a "Turkish" mode we do this.
    """
    if not text:
        return text
        
    mapping = {
        'İ': 'i',
        'I': 'ı'
    }
    
    result = []
    for char in text:
        if char in mapping:
            result.append(mapping[char])
        else:
            result.append(char.lower())
            
    return "".join(result)

def turkish_capitalize(text: str) -> str:
    """
    Capitalizes the first character using Turkish logic, lowers the rest.
    """
    if not text:
        return text
    if len(text) == 1:
        return turkish_upper(text)
    return turkish_upper(text[0]) + turkish_lower(text[1:])

def turkish_title(text: str) -> str:
    """
    Capitalizes each word in the string using Turkish logic.
    """
    if not text:
        return text
    # Split by space and capitalize each word
    return " ".join(turkish_capitalize(word) for word in text.split())
