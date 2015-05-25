(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.project = window.project || {};

  window.isEnabledlog = true;

  window.log = (function() {
    if (window.isEnabledlog) {
      if ((window.console != null) && (window.console.log.bind != null)) {
        return window.console.log.bind(window.console);
      } else {
        return window.alert;
      }
    } else {
      return function() {};
    }
  })();

  window.requestAnimationFrame = ((function(_this) {
    return function() {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback) {
        return setTimeout(callback, 1000 / 60);
      };
    };
  })(this))();

  window.cancelAnimationFrame = ((function(_this) {
    return function() {
      return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame || window.oCancelAnimationFrame || function(id) {
        return clearTimeout(id);
      };
    };
  })(this))();

  project.Main = (function() {
    var _POINT_ZERO, _SPHERE_RADIUS;

    _POINT_ZERO = new THREE.Vector3();

    _SPHERE_RADIUS = 400;

    function Main() {
      this.windowResizeHandler = bind(this.windowResizeHandler, this);
      this.update = bind(this.update, this);
      this.getRaycasterIntersects = bind(this.getRaycasterIntersects, this);
      this.mouseMoveHandler = bind(this.mouseMoveHandler, this);
      this.mouseUpHandler = bind(this.mouseUpHandler, this);
      this.mouseDownHandler = bind(this.mouseDownHandler, this);
      this.quaternionRotate = bind(this.quaternionRotate, this);
      this.hideImg = bind(this.hideImg, this);
      this.applyTexture = bind(this.applyTexture, this);
      this.createTexture = bind(this.createTexture, this);
      this.showImg = bind(this.showImg, this);
      var controls, i, j, len, ref, sphereMaterial, vertex;
      this.$window = $(window);
      this.$body = $('body');
      this.$canvas = $('canvas');
      this.canvasElm = this.$canvas.get(0);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 10, 10000);
      this.camera.target = _POINT_ZERO;
      this.camera.position.z = 1000;
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvasElm,
        antialias: true,
        alpha: true
      });
      this.currentIndex = 0;
      this.textures = [];
      this.textureVideos = [];
      this.isTextureVideo = false;
      this.textureData = [
        {
          type: 'img',
          path: 'assets/img/img1.jpg'
        }, {
          type: 'img',
          path: 'assets/img/img2.jpg'
        }, {
          type: 'video',
          path: 'assets/img/video1.mp4'
        }
      ];
      this.currentTextureVideo = null;
      this.currentTextureVideoCanvasCxt = null;
      this.clickedPoint = new THREE.Vector3(0, 0, -_SPHERE_RADIUS);
      controls = new THREE.OrbitControls(this.camera);
      controls.zoomSpeed = 0.4;
      this.sphereGeometry = new THREE.SphereGeometry(_SPHERE_RADIUS, 32, 16);
      this.sphereVertices = [];
      ref = this.sphereGeometry.vertices;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        vertex = ref[i];
        this.sphereVertices.push(vertex.clone());
        this.sphereGeometry.vertices[i].copy(this.clickedPoint);
      }
      this.sphereGeometry.verticesNeedUpdate = true;
      sphereMaterial = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        color: 0xcccccc,
        transparent: true,
        side: THREE.BackSide
      });
      this.imgSphere = new THREE.Mesh(this.sphereGeometry, sphereMaterial);
      this.scene.add(this.imgSphere);
      this.isAnimating = false;
      this.isMouseMoved = false;
      this.isMouseDown = false;
      this.canvasElm.addEventListener('mousedown', this.mouseDownHandler);
      this.canvasElm.addEventListener('touchstart', this.mouseDownHandler);
      this.canvasElm.addEventListener('mousemove', (function(_this) {
        return function(e) {
          return _this.mouseMoveHandler(e.clientX, e.clientY);
        };
      })(this));
      this.canvasElm.addEventListener('touchmove', (function(_this) {
        return function(e) {
          var touch;
          touch = e.touches[0];
          return _this.mouseMoveHandler(touch.clientX, touch.clientY);
        };
      })(this));
      this.canvasElm.addEventListener('mouseup', (function(_this) {
        return function(e) {
          return _this.mouseUpHandler(e.clientX, e.clientY);
        };
      })(this));
      this.canvasElm.addEventListener('touchend', (function(_this) {
        return function(e) {
          var touch;
          touch = e.touches[0];
          return _this.mouseUpHandler(touch.clientX, touch.clientY);
        };
      })(this));
      this.showImg();
      this.update();
      this.$window.on('resize', this.windowResizeHandler).trigger('resize');
    }

    Main.prototype.showImg = function() {
      var imgLoader, texture, textureData, video;
      if (this.isAnimating) {
        return;
      }
      this.isAnimating = true;
      textureData = this.textureData[this.currentIndex];
      texture = null;
      if (texture = this.textures[this.currentIndex]) {
        this.applyTexture(texture);
        if (textureData.type === 'video') {
          this.isTextureVideo = true;
          this.currentTextureVideo = this.textureVideos[this.currentIndex];
          this.currentTextureVideo.currentTime = 0;
          this.currentTextureVideo.play();
          return this.currentTextureVideoCanvasCxt = texture.image.getContext('2d');
        }
      } else {
        if (textureData.type === 'video') {
          video = document.createElement('video');
          video.src = textureData.path;
          video.load();
          this.textureVideos[this.currentIndex] = video;
          video.addEventListener('loadedmetadata', (function(_this) {
            return function(e) {
              var h, w;
              video.removeEventListener('loadedmetadata', arguments.callee);
              w = video.width = video.videoWidth;
              h = video.height = video.videoHeight;
              texture = _this.createTexture(video, w, h);
              texture.overdraw = true;
              return texture.minFilter = THREE.NearestFilter;
            };
          })(this));
          video.addEventListener('canplay', (function(_this) {
            return function(e) {
              video.removeEventListener('canplay', arguments.callee);
              _this.currentTextureVideo = video;
              _this.currentTextureVideoCanvasCxt = texture.image.getContext('2d');
              video.play();
              _this.applyTexture(texture);
              return _this.isTextureVideo = true;
            };
          })(this));
          return video.addEventListener('ended', function(e) {
            return video.play();
          });
        } else {
          imgLoader = new THREE.ImageLoader();
          return imgLoader.load(textureData.path, (function(_this) {
            return function(img) {
              texture = _this.createTexture(img, img.width, img.height);
              return _this.applyTexture(texture);
            };
          })(this));
        }
      }
    };

    Main.prototype.createTexture = function(src, width, height) {
      var canvas, ctx, texture;
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(src, 0, 0, width, height);
      texture = new THREE.Texture(canvas);
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      this.textures[this.currentIndex] = texture;
      return texture;
    };

    Main.prototype.applyTexture = function(texture) {
      var i, j, len, ref, ref1, timeline, vertex;
      if ((ref = this.imgSphere.material) != null) {
        ref.dispose();
      }
      this.imgSphere.material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        color: 0xcccccc,
        transparent: true,
        side: THREE.BackSide,
        map: texture
      });
      timeline = new TimelineMax();
      ref1 = this.sphereVertices;
      for (i = j = 0, len = ref1.length; j < len; i = ++j) {
        vertex = ref1[i];
        timeline.add(this.quaternionRotate(i, this.clickedPoint, vertex, true), 0);
      }
      return timeline.add((function(_this) {
        return function() {
          return _this.isAnimating = false;
        };
      })(this));
    };

    Main.prototype.hideImg = function(clientX, clientY) {
      var i, intersects, j, len, ref, timeline, vertex;
      if (this.isAnimating) {
        return;
      }
      if (this.isTextureVideo) {
        this.isTextureVideo = false;
        this.currentTextureVideo.pause();
      }
      intersects = this.getRaycasterIntersects(clientX, clientY);
      if (intersects.length === 0) {
        return;
      }
      this.isAnimating = true;
      this.clickedPoint.copy(intersects[0].point);
      timeline = new TimelineMax();
      ref = this.sphereGeometry.vertices;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        vertex = ref[i];
        timeline.add(this.quaternionRotate(i, vertex.clone(), this.clickedPoint, false), 0);
      }
      return timeline.add((function(_this) {
        return function() {
          _this.currentIndex = ++_this.currentIndex % _this.textureData.length;
          _this.isAnimating = false;
          return _this.showImg();
        };
      })(this));
    };

    Main.prototype.quaternionRotate = function(index, from, to, show) {
      var delay, normal, theta, tweenObj;
      if (show == null) {
        show = true;
      }
      normal = _POINT_ZERO.clone();
      normal.crossVectors(from, to).normalize();
      theta = Math.acos(from.dot(to) / (from.distanceTo(_POINT_ZERO) * to.distanceTo(_POINT_ZERO)));
      if (show) {
        delay = (Math.PI - Math.abs(theta)) / Math.PI;
      } else {
        delay = Math.abs(theta) / Math.PI;
      }
      tweenObj = {
        r: 0
      };
      return TweenMax.to(tweenObj, 0.6 + delay, {
        r: theta,
        delay: delay,
        ease: Expo.easeInOut,
        onUpdate: (function(_this) {
          return function() {
            var matrix, quaternion, vector4;
            vector4 = new THREE.Vector4(from.x, from.y, from.z, 1);
            quaternion = new THREE.Quaternion();
            quaternion.setFromAxisAngle(normal, tweenObj.r);
            matrix = new THREE.Matrix4();
            matrix.makeRotationFromQuaternion(quaternion);
            vector4.applyMatrix4(matrix);
            _this.sphereGeometry.vertices[index].set(vector4.x, vector4.y, vector4.z);
            return _this.sphereGeometry.verticesNeedUpdate = true;
          };
        })(this)
      });
    };

    Main.prototype.mouseDownHandler = function(e) {
      this.isMouseDown = true;
      return this.isMouseMoved = false;
    };

    Main.prototype.mouseUpHandler = function(clientX, clientY) {
      if (this.isMouseDown && !this.isMouseMoved) {
        this.hideImg(clientX, clientY);
      }
      this.isMouseMoved = false;
      return this.isMouseDown = false;
    };

    Main.prototype.mouseMoveHandler = function(clientX, clientY) {
      var color, intersect, intersects;
      this.isMouseMoved = true;
      intersects = this.getRaycasterIntersects(clientX, clientY);
      if (intersects.length > 0) {
        intersect = intersects[0];
        color = this.sphereGeometry.faces[intersect.faceIndex].color;
        TweenMax.killTweensOf(color);
        TweenMax.to(color, 0.2, {
          r: Math.random() * 6,
          g: Math.random() * 6,
          b: Math.random() * 6,
          ease: Sine.easeOut,
          onUpdate: (function(_this) {
            return function() {
              return _this.sphereGeometry.colorsNeedUpdate = true;
            };
          })(this)
        });
        return TweenMax.to(color, 0.6, {
          r: 1,
          g: 1,
          b: 1,
          ease: Sine.easeInOut,
          delay: 0.2,
          onUpdate: (function(_this) {
            return function() {
              return _this.sphereGeometry.colorsNeedUpdate = true;
            };
          })(this)
        });
      }
    };

    Main.prototype.getRaycasterIntersects = function(clientX, clientY) {
      var mouse, raycaster;
      mouse = new THREE.Vector2();
      mouse.x = (clientX / this.canvasElm.width) * 2 - 1;
      mouse.y = -(clientY / this.canvasElm.height) * 2 + 1;
      raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      return raycaster.intersectObject(this.imgSphere, true);
    };

    Main.prototype.update = function() {
      if (this.isTextureVideo) {
        this.currentTextureVideoCanvasCxt.drawImage(this.currentTextureVideo, 0, 0);
        this.textures[this.currentIndex].needsUpdate = true;
      }
      this.camera.lookAt(this.camera.target);
      this.renderer.render(this.scene, this.camera);
      return requestAnimationFrame(this.update);
    };

    Main.prototype.windowResizeHandler = function(e) {
      var aspect, height, width;
      width = window.innerWidth;
      height = window.innerHeight;
      aspect = width / height;
      this.renderer.setSize(width, height);
      this.renderer.setViewport(0, 0, width, height);
      this.camera.aspect = aspect;
      return this.camera.updateProjectionMatrix();
    };

    return Main;

  })();

  $(function() {
    return new project.Main();
  });

}).call(this);
