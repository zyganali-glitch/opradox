from app.turkish_utils import turkish_upper, turkish_lower, turkish_title, turkish_capitalize

def test_turkish():
    cases = [
        ("istanbul", "upper", "İSTANBUL"),
        ("IĞDIR", "lower", "ığdır"),
        ("izmir", "capitalize", "İzmir"),
        ("istanbul ve ığdır", "title", "İstanbul Ve Iğdır"),
    ]
    
    print("Testing Turkish Utils...")
    for text, mode, expected in cases:
        if mode == "upper":
            res = turkish_upper(text)
        elif mode == "lower":
            res = turkish_lower(text)
        elif mode == "capitalize":
            res = turkish_capitalize(text)
        elif mode == "title":
            res = turkish_title(text)
            
        status = "PASS" if res == expected else f"FAIL (Got: {res})"
        print(f"[{status}] {mode}({text}) -> Expected: {expected}")

if __name__ == "__main__":
    test_turkish()
