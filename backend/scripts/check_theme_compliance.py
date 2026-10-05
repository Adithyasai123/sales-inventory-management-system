#!/usr/bin/env python3
import os
import re
import sys
import glob

def check_theme_compliance():
    forbidden_patterns = [
        r'\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\b',
        r'\bfont-(bold|semibold|medium)\b',
        r'\btext-(gray|slate|zinc|neutral|stone|red|blue|green|purple|yellow|emerald|indigo|violet|cyan|amber|orange|rose)-[0-9]+\b',
        r'\bbg-(gray|slate|zinc|neutral|stone|red|blue|green|purple|yellow|emerald|indigo|violet|cyan|amber|orange|rose)-[0-9]+\b',
        r'#[0-9a-fA-F]{3,6}',
    ]

    combined_regex = re.compile('|'.join(forbidden_patterns))

    # Exclude theme configuration file itself
    exclude_files = {
        'theme.config.ts',
        'ThemeProvider.tsx',
        'tailwind.config.js',
        'index.css',
    }

    frontend_dir = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src'))
    files = glob.glob(os.path.join(frontend_dir, '**', '*.tsx'), recursive=True) + \
            glob.glob(os.path.join(frontend_dir, '**', '*.ts'), recursive=True)

    violations = []
    for fpath in files:
        fname = os.path.basename(fpath)
        if fname in exclude_files:
            continue

        with open(fpath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for idx, line in enumerate(lines, 1):
            # Skip comments
            if line.strip().startswith('//') or line.strip().startswith('*'):
                continue
            matches = combined_regex.findall(line)
            if matches:
                violations.append((fpath, idx, line.strip()))

    if violations:
        print(f"FAILED: Found {len(violations)} raw typography or color class violations outside theme layer:")
        for path, line_no, content in violations[:20]:
            print(f"  {os.path.basename(path)}:{line_no}: {content}")
        print("\nComponents must use semantic type scale (.text-display, .text-title, .text-subtitle, .text-body, .text-body-lg, .text-label, .text-overline, .text-caption, .text-kpi, .text-btn) and semantic color tokens.")
        return 1

    print("SUCCESS: Zero raw color or typography class violations found! All components follow theme tokens.")
    return 0

if __name__ == '__main__':
    sys.exit(check_theme_compliance())
