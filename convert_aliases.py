import os
import re

def convert_aliases(root_dir):
    src_dir = os.path.join(root_dir, 'src')
    for subdir, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(subdir, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Calculate relative path to src
                rel_path = os.path.relpath(src_dir, subdir)
                if rel_path == '.':
                    rel_prefix = './'
                else:
                    rel_prefix = rel_path.replace('\\', '/') + '/'
                
                # Replace @/ with rel_prefix
                # Pattern matches import ... from "@/..." or import "@/..."
                new_content = re.sub(r'([\'"])@/', rf'\1{rel_prefix}', content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Converted: {filepath}")

if __name__ == "__main__":
    project_root = r'C:/Users/Gustavo/Desktop/Gustavo/Aplicativos/OnDose/ondose'
    convert_aliases(project_root)
