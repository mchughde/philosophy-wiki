"""
Inserts <w:mirrorMargins/> into a .docx so Word uses book-style
mirrored inner/outer margins. Patches the file in-place.

Usage: python3 patch_mirror_margins.py <file.docx>
"""
import sys, zipfile, io

def patch(docx_path):
    with zipfile.ZipFile(docx_path, 'r') as z:
        names = z.namelist()
        data  = {n: z.read(n) for n in names}
        info  = {n: z.getinfo(n) for n in names}

    key = 'word/settings.xml'
    settings = data[key].decode('utf-8')

    if '<w:mirrorMargins/>' in settings:
        print('Already patched.')
        return

    patched = settings.replace(
        '<w:displayBackgroundShape/>',
        '<w:displayBackgroundShape/>\n  <w:mirrorMargins/>'
    )
    if patched == settings:
        patched = settings.replace('</w:settings>', '  <w:mirrorMargins/>\n</w:settings>')

    data[key] = patched.encode('utf-8')

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as zout:
        for n in names:
            zout.writestr(zipfile.ZipInfo(n), data[n],
                          compress_type=info[n].compress_type)

    with open(docx_path, 'wb') as f:
        f.write(buf.getvalue())

    print('✓ Mirror margins applied')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 patch_mirror_margins.py <file.docx>')
        sys.exit(1)
    patch(sys.argv[1])
