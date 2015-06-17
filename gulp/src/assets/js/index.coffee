window.project = window.project || {}

# console.log wrapper
window.isEnabledlog = true
window.log = (->
  if window.isEnabledlog
    if window.console? and window.console.log.bind?
      return window.console.log.bind window.console
    else
      return window.alert
  else ->
)()

# requestAnimationFrame wrapper
window.requestAnimationFrame = (=>
  return  window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          window.msRequestAnimationFrame ||
          window.oRequestAnimationFrame ||
          (callback)=> return setTimeout(callback, 1000 / 60)
)()

# cancelAnimationFrame wrapper
window.cancelAnimationFrame = (=>
  return  window.cancelAnimationFrame ||
          window.webkitCancelAnimationFrame ||
          window.mozCancelAnimationFrame ||
          window.msCancelAnimationFrame ||
          window.oCancelAnimationFrame ||
          (id)=> return clearTimeout(id)
)()


# ドキュメントクラス
class project.Main
  _POINT_ZERO = new THREE.Vector3()
  _SPHERE_RADIUS = 400

  constructor: ->
    @$window = $　window
    @$body   = $ 'body'

    @$canvas = $ 'canvas'
    @canvasElm = @$canvas.get 0

    @scene = new THREE.Scene()
    @camera = new THREE.PerspectiveCamera 35, window.innerWidth / window.innerHeight, 10, 10000
    @camera.target = _POINT_ZERO
    @camera.position.z = 1000
    @renderer = new THREE.WebGLRenderer
      canvas: @canvasElm
      antialias: true
      alpha: true
    @renderer.setPixelRatio window.devicePixelRatio

    # texture
    @currentIndex = 0
    @textures = []
    @textureVideos = []
    @isTextureVideo = false
    @textureData = [
      { type: 'img', path: 'assets/img/img1.jpg' }
      { type: 'img', path: 'assets/img/img2.jpg' }
      { type: 'video', path: 'assets/img/video1.mp4' }
    ]
    @currentTextureVideo = null
    @currentTextureVideoCanvasCxt = null

    @clickedPoint = new THREE.Vector3 0, 0, -_SPHERE_RADIUS

    # control
    @controls = new THREE.TrackballControls @camera
    @controls.zoomSpeed = 0.4


    # sphere for img
    @sphereGeometry = new THREE.SphereGeometry _SPHERE_RADIUS, 32, 16
    @sphereVertices = []
    for vertex, i in @sphereGeometry.vertices
      @sphereVertices.push vertex.clone()
      @sphereGeometry.vertices[i].copy @clickedPoint
    @sphereGeometry.verticesNeedUpdate = true

    sphereMaterial = new THREE.MeshBasicMaterial
      vertexColors: THREE.FaceColors
      color: 0xcccccc
      transparent: true
      side: THREE.BackSide

    @imgSphere = new THREE.Mesh @sphereGeometry, sphereMaterial
    @scene.add @imgSphere

    # interaction
    @isAnimating = false
    @isMouseMoved = false
    @isMouseDown = false

    @canvasElm.addEventListener 'mousedown', @mouseDownHandler
    @canvasElm.addEventListener 'touchstart', @mouseDownHandler

    @canvasElm.addEventListener 'mousemove', (e)=> @mouseMoveHandler e.clientX, e.clientY
    @canvasElm.addEventListener 'touchmove', (e)=>
      touch = e.touches[0]
      @mouseMoveHandler touch.clientX, touch.clientY

    @canvasElm.addEventListener 'mouseup',  (e)=> @mouseUpHandler e.clientX, e.clientY
    @canvasElm.addEventListener 'touchend', (e)=>
      touch = e.touches[0]
      @mouseUpHandler touch.clientX, touch.clientY


    @showImg()
    @update()


    @$window.on('resize', @windowResizeHandler).trigger 'resize'


  # 画像を表示
  showImg: =>
    if @isAnimating then return
    @isAnimating = true

    textureData = @textureData[@currentIndex]

    texture = null
    if texture = @textures[@currentIndex]
      # ロード済み
      @applyTexture texture
      if textureData.type is 'video'
        # 動画
        @isTextureVideo = true
        @currentTextureVideo = @textureVideos[@currentIndex]
        @currentTextureVideo.currentTime = 0
        @currentTextureVideo.play()
        @currentTextureVideoCanvasCxt = texture.image.getContext '2d'
    else
      # 未ロード
      if textureData.type is 'video'
        # 動画
        video = document.createElement 'video'
        video.src = textureData.path
        video.load()
        @textureVideos[@currentIndex] = video

        video.addEventListener 'loadedmetadata', (e)=>
          video.removeEventListener 'loadedmetadata', arguments.callee
          w = video.width = video.videoWidth
          h = video.height = video.videoHeight

          texture = @createTexture video, w, h
          texture.overdraw = true
          texture.minFilter = THREE.NearestFilter

        video.addEventListener 'canplay', (e)=>
          video.removeEventListener 'canplay', arguments.callee
          @currentTextureVideo = video
          @currentTextureVideoCanvasCxt = texture.image.getContext '2d'
          video.play()

          @applyTexture texture
          @isTextureVideo = true

        video.addEventListener 'ended', (e)-> video.play()

      else
        # 画像
        imgLoader = new THREE.ImageLoader()
        imgLoader.load(
          textureData.path
          (img) =>
            texture = @createTexture img, img.width, img.height
            @applyTexture texture
        )


  # テクスチャ生成
  createTexture: (src, width, height)=>
    canvas = document.createElement 'canvas'
    canvas.width = width
    canvas.height = height
    ctx = canvas.getContext '2d'
    ctx.translate width, 0
    ctx.scale -1, 1
    ctx.drawImage src, 0, 0, width, height
    texture = new THREE.Texture canvas
    texture.minFilter = THREE.NearestFilter
    texture.needsUpdate = true

    @textures[@currentIndex] = texture
    return texture



  # テクスチャを適用してアニメーション
  applyTexture: (texture)=>
    @imgSphere.material?.dispose()
    @imgSphere.material = new THREE.MeshBasicMaterial
      vertexColors: THREE.FaceColors
      color: 0xcccccc
      transparent: true
      side: THREE.BackSide
      map: texture

    timeline = new TimelineMax()
    for vertex, i in @sphereVertices then timeline.add @quaternionRotate(i, @clickedPoint, vertex, true), 0

    timeline.add => @isAnimating = false


  # 画像を切り替える前のアニメーション
  hideImg: (clientX, clientY)=>
    if @isAnimating then return

    if @isTextureVideo
      # videoであれば停止
      @isTextureVideo = false
      @currentTextureVideo.pause()


    intersects = @getRaycasterIntersects clientX, clientY
    if intersects.length is 0 then return

    @isAnimating = true
    @clickedPoint.copy intersects[0].point

    timeline = new TimelineMax()
    for vertex, i in @sphereGeometry.vertices then timeline.add @quaternionRotate(i, vertex.clone(), @clickedPoint, false), 0

    timeline.add =>
      @currentIndex = ++@currentIndex % @textureData.length
      @isAnimating = false
      @showImg()



  # クォータニオン回転
  quaternionRotate: (index, from, to, show = true)=>
    # 回転の軸となる法線ベクトルを求める
    normal = _POINT_ZERO.clone()
    normal.crossVectors(from, to).normalize()

    # 2つのベクトルがなす角度を求める
    theta = Math.acos(from.dot(to) / (from.distanceTo(_POINT_ZERO) * to.distanceTo(_POINT_ZERO)))

    if show
      delay = (Math.PI - Math.abs(theta)) / Math.PI
    else
      delay = Math.abs(theta) / Math.PI

    tweenObj = { r: 0 }
    return TweenMax.to tweenObj, 0.6 + delay, {
      r: theta
      delay: delay
      ease: Expo.easeInOut
      onUpdate: =>
        # 4x4の回転行列を掛けるので、ベクトルも4x1に
        vector4 = new THREE.Vector4 from.x, from.y, from.z, 1

        # 法線ベクトルと角度からクォータニオンを生成
        quaternion = new THREE.Quaternion()
        quaternion.setFromAxisAngle normal, tweenObj.r

        # 生成したクォータニオンから回転行列を生成、ベクトルに掛ける
        matrix = new THREE.Matrix4()
        matrix.makeRotationFromQuaternion quaternion
        vector4.applyMatrix4 matrix

        # 変形後の頂点を反映
        @sphereGeometry.vertices[index].set vector4.x, vector4.y, vector4.z
        @sphereGeometry.verticesNeedUpdate = true
    }


  # mosue down (touch start)
  mouseDownHandler: (e)=>
    @isMouseDown = true
    @isMouseMoved = false


  # mosue up (touch end)
  mouseUpHandler: (clientX, clientY)=>
    if @isMouseDown and !@isMouseMoved then @hideImg clientX, clientY
    @isMouseMoved = false
    @isMouseDown = false

  # mosue move (touch move)
  mouseMoveHandler: (clientX, clientY)=>
    @isMouseMoved = true
    intersects = @getRaycasterIntersects clientX, clientY

    # 交差しているMeshがあれば、intersectsの配列に格納される
    if intersects.length > 0
      intersect = intersects[0]
      color = @sphereGeometry.faces[intersect.faceIndex].color
      TweenMax.killTweensOf color
      TweenMax.to color, 0.2, { r: Math.random() * 6, g: Math.random() * 6, b: Math.random() * 6, ease: Sine.easeOut, onUpdate: => @sphereGeometry.colorsNeedUpdate = true }
      TweenMax.to color, 0.6, { r: 1, g: 1, b: 1, ease: Sine.easeInOut, delay: 0.2, onUpdate: => @sphereGeometry.colorsNeedUpdate = true }



  # インタラクション判定
  getRaycasterIntersects: (clientX, clientY)=>
    # スクリーン上のマウス位置を取得する
    mouse = new THREE.Vector2()
    mouse.x = (clientX / @canvasElm.width) * 2 - 1
    mouse.y = -(clientY / @canvasElm.height) * 2 + 1

    raycaster = new THREE.Raycaster()
    raycaster.setFromCamera mouse, @camera

    # 交差判定
    # 引数は取得対象となるMeshの配列を渡す。(子要素も対象とする場合は第二引数にtrueを指定する)
    return raycaster.intersectObject @imgSphere, true


  # 描画更新
  update: =>
    @controls.update()

    if @isTextureVideo
      # 動画
      @currentTextureVideoCanvasCxt.drawImage @currentTextureVideo, 0, 0
      @textures[@currentIndex].needsUpdate = true

    @camera.lookAt @camera.target
    @renderer.render @scene, @camera
    requestAnimationFrame @update


  # ウィンドウリサイズ
  windowResizeHandler: (e)=>
    width = window.innerWidth
    height = window.innerHeight
    aspect = width / height

    @renderer.setSize width, height
    @renderer.setViewport 0, 0, width, height
    @camera.aspect = aspect
    @camera.updateProjectionMatrix()




# Document Ready
$ -> new project.Main()
