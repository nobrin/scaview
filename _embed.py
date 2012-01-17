#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Project:
# Module:
import cgi, sys
from xml.dom.minidom import parseString
def log(msg): sys.stderr.write(str(msg) + "\n")

class TemplateProcessor(object):
    def process(self, filename):
        js_files = []
        buf = ""
        chk = 0
        fh = open(filename, "r")
        for line in fh:
            if line.strip().startswith("<script ") and line.strip().endswith("</script>"):
                el = parseString(line)
                if el.documentElement.getAttribute("embed"):
                    js_files.append(el.documentElement.getAttribute("src"))
                    if not chk:
                        chk = line.find("<script ")
                        buf += " " * chk + '<script type="text/javascript">\n'
                    buf += self._load_external(js_files[-1])
                    continue
            if chk:
                buf += " " * chk + "</script>\n"
                chk = 0
            buf += line
        return buf

    def _load_external(self, filename):
        fh = open(filename, "r")
        buf = ""
        for line in fh: buf += "\t" + line
        fh.close()
        return buf

def application(environ, start_response):
    status = "200 OK"
    headers = [("Content-type", "text/html; charset=utf-8")]
    start_response(status, headers)

    form = cgi.FieldStorage()
    tmpl = form["html"].value + ".html"
    processor = TemplateProcessor()
    return [processor.process(tmpl)]

if __name__ == "__main__":
    from wsgiref import handlers
    handlers.CGIHandler().run(application)

