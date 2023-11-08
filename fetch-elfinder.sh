rm -rf elFinder-gh-pages/
wget https://github.com/imjoy-team/elFinder/archive/refs/heads/gh-pages.zip
unzip gh-pages.zip 
rm gh-pages.zip 
rm -rf elFinder
mv elFinder-gh-pages/ packages/lite/dist/lib/elFinder
cp packages/lite/dist/lib/elFinder/service-worker.js packages/lite/dist/lib
cp packages/lite/dist/lib/elFinder/service-worker.js.map packages/lite/dist/lib
