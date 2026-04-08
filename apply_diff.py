import sys

def apply_diff(file_path, diff_path):
    with open(file_path, 'r') as f:
        content = f.read()

    with open(diff_path, 'r') as f:
        diff = f.read()

    import re
    pattern = re.compile(r'<<<<<<< SEARCH\n(.*?)\n=======\n(.*?)\n>>>>>>> REPLACE', re.DOTALL)
    match = pattern.search(diff)
    if not match:
        print("Diff format error")
        return

    search_text = match.group(1)
    replace_text = match.group(2)

    if search_text in content:
        new_content = content.replace(search_text, replace_text)
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Success")
    else:
        print("Search text not found")

if __name__ == "__main__":
    apply_diff(sys.argv[1], sys.argv[2])
