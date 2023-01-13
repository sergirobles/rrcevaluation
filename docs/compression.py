#!/usr/bin/env python3
#encoding: UTF-8

import zipfile
import sys
import os
from io import StringIO, BytesIO
from PIL import Image

if __name__ == "__main__":
    
    try:

        if len(sys.argv) < 2:
            print("Enter the name of the ZIP file")
            sys.exit()

        zipFileName = sys.argv[1]

        if os.path.isfile(zipFileName) == False:
            print("File not found. Enter only the name of the zip file (in the current folder) %s" % zipFileName)
            sys.exit()

        if zipFileName[-3:] != "zip":
            print("Not valid file, must be a ZIP file")
            sys.exit()

        basename = os.path.basename(zipFileName)

        zipFileNameOut = "%s-compressed.zip" % basename[:-4]

        archive=zipfile.ZipFile(zipFileName,'r')

        outZip = zipfile.ZipFile(zipFileNameOut, 'w')

        cont = 1

        for filename in archive.namelist():

            print("#%s File: %s" % (cont,filename))

            cont+=1

            if filename[-4:] == ".jpg" or filename[-5:] == ".jpeg":

                im = Image.open(archive.open(filename))
                im.thumbnail([1024,1024], Image.Resampling.LANCZOS)
                output = BytesIO()
                im.save(output ,'JPEG',quality=75,optimize=True)            
                outZip.writestr(filename,output.getvalue())

            elif filename[-4:] == ".png":

                im = Image.open(archive.open(filename))
                im.thumbnail([1024,1024], Image.Resampling.LANCZOS)
                output = BytesIO()
                im.save(output ,'PNG',quality=75,optimize=True)       

                outZip.writestr(filename,output.getvalue())

            else:

                outZip.writestr(filename,archive.read(filename))

        outZip.close()

        print("Done. A new ZIP with the compressed images is located at: %s" % os.path.abspath(zipFileNameOut))

    except Exception as e:   
        print("Error %s" % e)
