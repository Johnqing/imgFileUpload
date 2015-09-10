/**
 * 创建CORSRequest
 * @param method
 * @param url
 * @returns {XMLHttpRequest}
 */
function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest()
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true)
    } else if (typeof XDomainRequest !== "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest()
        xhr.open(method, url)
    } else {
        // CORS not supported.
        xhr = null
    }
    return xhr
}

var dataURItoBlob = function(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {
        type: mimeString
    });
};
/**
 * 图片缩放
 * @param file
 * @param callback
 * @param options
 */
function fileResize(file, callback, options){
    var img = document.createElement("img");
    var reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;

        img.onload = function(){
            //resize the image using canvas
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var MAX_WIDTH = options.width;
            var MAX_HEIGHT = options.height;
            var width = img.width;
            var height = img.height;
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            //change the dataUrl to blob data for uploading to server
            var dataURL = canvas.toDataURL('image/jpeg');
            var blob = dataURItoBlob(dataURL);

            callback && callback(blob);
        }
    };
    reader.readAsDataURL(file);
}

function postFile({
    url, name, cors,
    file,
    onProgress, onLoad, onError, withCredentials, formData,
    onUploadError, onUploadSuccess,
    onUploadComplete
    }){
    let data = new FormData();
    data.append(name, file);

    if(formData){
        for(var key in formData){
            data.append(key, formData[key]);
        }
    }

    let xhr = createCORSRequest('post', url, cors);

    xhr.onreadystatechange = function(e){
        if (xhr.readyState == 4) {
            let data = xhr.responseText;
            try{
                data = JSON.parse(data);
            }catch(err){
                alert(err);
            }

            if (xhr.status == 200) {
                if(data.code == '0000'){
                    onUploadSuccess && onUploadSuccess(null, data.data, file);
                } else {
                    onUploadSuccess && onUploadSuccess(data.code, data.msg, file);
                }
            } else {
                onUploadError&&onUploadError(data, file);
            }
            onUploadComplete &&  onUploadComplete(data);
        }
    }

    xhr.withCredentials = withCredentials;
    xhr.upload.addEventListener('progress', onProgress, false);
    xhr.onload = onLoad;
    xhr.onerror = onError;
    xhr.send(data);

    return xhr
}
/**
 * 上传
 * @param url           上传URL
 * @param name          服务端接收的字段名
 * @param cors          暂时无用
 * @param file          文件
 * @param width         最大宽度
 * @param height        最大高度
 * @param onProgress
 * @param onLoad
 * @param onError
 * @param withCredentials
 * @param formData
 * @param onUploadError
 * @param onUploadSuccess
 * @param onUploadComplete
 */
function upload({
    url, name, cors, file,
    width,
    height,
    onProgress, onLoad, onError, withCredentials, formData, onUploadError, onUploadSuccess, onUploadComplete}) {
    fileResize(file, function(blob_data){
        postFile({
            url: url,
            name: name,
            cors: cors,
            file: blob_data,
            onProgress: onProgress,
            onLoad: onLoad,
            onError: onError,
            withCredentials: withCredentials,
            formData: formData,
            onUploadError: onUploadError,
            onUploadSuccess: onUploadSuccess,
            onUploadComplete: onUploadComplete
        });
    }, {
        width: width || '200',
        height: height || '200'
    });
}

module.exports = upload;
