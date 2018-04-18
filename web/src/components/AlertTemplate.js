// Copied from 
// https://github.com/schiehll/react-alert-template-oldschool-dark/blob/master/src/index.js
// modifications:
//   - remove textTransform: uppercase (not overridable)

import React from 'react'

const alertStyle = {
  backgroundColor: '#333333',
  color: 'white',
  borderRadius: '2px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 8px 12px 0 rgba(0,0,0,0.3)',
  width: '300px',
  boxSizing: 'border-box',
  fontSize: '11px',
  position: 'relative'
}

const contentWrapperStyle = {
  padding: '10px 60px 10px 10px',
  display: 'flex',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center'
}

const iconPlaceholderStyle = {
  display: 'flex',
  justifyContent: 'center',
  width: '50px'
}

const messageStyle = {
  flex: 3,
  textAlign: 'center',
  width: '100%'
}

const closeButtonStyle = {
  minWidth: '50px',
  height: '100%',
  position: 'absolute',
  borderRadius: '0 2px 2px 0',
  cursor: 'pointer',
  top: 0,
  right: 0,
  backgroundColor: '#444',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const getIcon = type => {
  switch (type) {
    case 'error':
      return `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAgCAYAAADqgqNBAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEKklEQVRIiZ2WzW5TRxTHf2dMEtckbYwi0tIgpVI3SJFYVO4uq+67ZUeRuuIVeAsCyBKlUrup2PIEfQCQWNBFpGYBsnBTtZZdnMSkxHO6mI87M/dahE40yvjcmfP/n88Z4f8PWbBuGtq0zg4dffP1NvArsH1uTRpkiu58xb/Xrn9/+fbtn98HDKgp9N76UGCNf24stVo//vHgwS2cYQIYKiMzY0vwc48KmGwCtJeWHg3v3/8uAQ4zJSAfBB6Uq+Zyq26m4o+Wlx+9vnfvZgGeETg3eGmhRbGQTMUuLWVnOisrPwz29hZ54P3gqTujTN20CtZW7kdBVdHENavt9sPB3t7NBgKL3Z6CBrA4UayHtKgjYuFs/zfs8dSfqUisttsPX929+y1Fwl1oAk0tdDK3sAWxMgRy/A+nT35BREBBBARBgAtqrwNPPAGtgduEWla/KVhweQBO1pGY1YSAAhKIB2ABtGZ5dHMKqqml6sHUW+0hNQLgcNXrMsiC/peCyyJgG4C8eVar71WJqTdJEZXoQo2G5vaV4FiLGKEGHADs2ifYy1uwvhHPGMCO/8b+OYDpBFXBCpiEgLMqEohpFcCTL9oArMy3vkQ3txrdZ7obmO4G88MBdnDglPlYB5cbicAx4dJSE4uNtDLgz7YjcOvSpRp4kLU+vUrryhdOv4pv7DGFU8sVf7FkASkTzC630SvbAHR6PTbv3KHT68X9pcx8vg0rK67MgtsFjHNFmAL1UpNWRkBdjP24uLsLwPqNG1EW1hd3dzl5+tSBbV5FB7876yWzLq3IenvNsl2Bzmr8Nur3eTccRtAA/G44ZNTvx33SWXU1HlNeMM4NWbfOYt5Ib2298sxsxqjfZz4eR9l8PGbU72Nns0rR2jppqvsQlDVXe0yk37z2s0za3tmh1e3G361ul/bOTn709K2Lt5RXUlTc7PbazjeTuO70epmr0xCkSagnR7VL3GQWuZGCFw87H7HJX3FDSLgQ4zQHwjf8mUxHA0YJ7ranXQlgdAinb92y3+fk2bMY45ADQQa4vaPDTMei3m6KHxr4iriuZBDswQuYn2FnMyaPH2fJlcnmZ9iDFxgEExLNUzCF1QE8E+ZvHd+lZsfY/efodFKej0OnE+z+c8zsODubvZuS7ZA3GTWeiwiICiZkqwKegF1bR9a6yMeuBPXNBJ2OkekEI4LBe0wqDzorTQQNo3afp89LgdAcQN0DwR5N0OkEHVZnHJjE/UbqT9amogvgCogxqLv6nPVGBYv6G8nJDZK1KYGkhVbAhqq1CoKYvHc1Wo7fbNB4LyvuOaSIa79S7icHIlwmDcXWYHlkJOJ6eiCg4XHhSahotZk0TFKQqID9cy6zGuql9hPwsqr1KmNDErVEMAgtPw3iZDHJ6sDAS6+75rGmIQ3r8n85yphqw7ds/AdwGih6rYATKAAAAABJRU5ErkJggg==') no-repeat`
    case 'info':
      return `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAfCAYAAAAfrhY5AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADeUlEQVRIiaWXv28cRRTHPzOz9yPGiEuVLkpBhQQk/4AjUtBZAruhQBC3lPRRhOjzLwSnoiAxIR0SWL6WhkAbgUVDikg+O9h33tuZR7Eze7Ozu87ZftLT3s3NvM/3vdl9c6u4oMkzbgK7/utHap3fzxtDXRI88kOTiwjQ5+SqfIdbIuyKMBIB7yMRdvMdbp0rmHdZYh75Djczw68sMk5tUlju9D+tKnBm3Fa4L+toXnCoFCMF76D4RCm+rOZEK1Rz87bF8aPAIUBmEGCSbkuAVyrlGQ9FuEs8GMHkjFyCiOra/O07tc5WJ9z9tKhCDA6OahcQgsQCUhFKgVpfaMq6spAUGsacH+sAqyBAFmNec0N0CldtYAGcq4+HeWFRBZZF1kpA67qAoCPAazdco9Qe7AJUK3pvGXSmyPoaZwVXCPOZw55aFB7owc4tBKSWJQl0gp1AbyVjsGoWq0draEBPxmQDjbOG6WSOtYKJwNIglAk3yt4F7q9m9FdMffYHP5fX8RAAbRQrV/ucHOQ4KxVYfG3T7EOHqw1Xe+uvOtNNcIcpDYO3M6zz90l8j0id1Wiv8R0pVbmXAwfL+hrT06V46gISnSUnFRB7b3jeIwBMXzcf1URAHDVuODXVF7Gsr1ofyxR+wfBvtg5w955Tns2XtnnemlMtdgPuhHE6ls9cO2E8rB6z1IpT1+jtPnalKoYLINaxFxaEtnl6bNvha7PSE5ufOorcNQ6XELsNDsCrI55Wvdm7zR2z/zoEJCYOTg4LdBID4PWUp2fCr2+xbx2PoFykvU+PCqavEwF/fFy6N1sIR69yxMrioPFxRHh07XP2Y5218z74Pw+5cW3Ei7i9OgfWAVoxXDVkPUVvoLGFUMzLgyU/sWhdijWa6rPW8PKAd69v8TfR2ZXCKxHHP3A/M9xLBThp71ihSsrDjKY64Zzj2yubfMOifTTgcfYAevaEX5RiLYa2wcOe6ggYriKMhxvcScHQ/pxXE/7cZxPheVw+4z0zYIKH7/63MBfh+V8v2aCjkbW9NNTK/9sDrr5/g8dasVb7h9O2IL67hb0X/7L53lccpEktA6/FnT7mvtHcW+YPZGFre9wK7oJ3Cph8z4crAx4oxe2OdXvHM74efdb60tCQ/KZ3tTYRTJ9w22juasUXfmh7btm+slF1sBS09J5fZl5qZ56Y/wP3DczlGSWQRAAAAABJRU5ErkJggg==') no-repeat`
    case 'success':
      return `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAAAgCAYAAADqgqNBAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAD9UlEQVRIiZ2WzWucRRzHPzO7efYlu8HmxfRiaMMWxByECnpaPAmezH9QC/0ThJ4LXmx79VRb0IMnT/4FBWuo8WBAaVEJ0q5IqzEbNLubZrN5xsO87Mw88ySpA5M8efLMfH7f39uM4P8PUfKcGir1HC66/+UF4D5w4eStVPLd+/PLvNdeuPZR560vTgMDSkZbXH1psFLehEq1eu/2L99fRQsTgGQqMhAbw19uRGArbKZWu3v7580PPbCdvgHi5eApdzsj8sCpM/X63VuPv7sSwQMDzg4PVCrIczOV+10XYQplzcZnNx89LPPAGeAWlvyf+aFw3yilUN73tdnmnZuPHl5JGHCC20+EGrX2txnf7P5Jf3xYMKI227zzyU8bHxAlXDW5cdk7D+SSTOEM6R+/4ONffwTf/VKAlHA0eRP42higivA8Dxf6HrAgm1XuXe49K7O33UfEHrRgAaii8hSUqKRc0pksd970jBSAUFp1iUd9+FRyDM6jTE9NCw92MspjbybdbpeVgDv1JmvtOeZnMrdgnOf0RgO29vYYTI50TitMbgtvhmAfHqkOwRnQPbfISqNZcF0mJZ3WHCvNFpu7O2zv7+skU2i32zBr9d6LsM6FKx9fcZ7TfWUhCY6N6C4tc75RNzBPOYCQNhvc9Jv+1CleLDvN2VPB/uguncf1Eetg4cTiP4RNJs9DQ3LF2uzcqcCVRptP197lxqW3aVWrdFptAvUIHYrwSE21V79mFfNZxuutc6wvr7KY1ZPg66uXaVaqLGYNABaymtldesqd6oLyoOHHJbS+fJH15YvcuPQOK412Ejw6nnDrtx8AmM8yDQxKUMSFXrhMJMe3/WcANCtVrq9eZqXRToJ7B/uALj8HDpuLDX6yzgtjnOds7Gn4tdfecAZYY2IwQP9oHNX4mWMejt5oCMDG3jPu/f7YQcvAAE9HQ6/EghxOwoNE8C3e+mdPuzEyoAzcGw3pj8eAV+Mll9uE24XODVMig+NjNvt/01181RkwOp6we/SiAO6PD3mw+5d2ccyVsnCyhHD7gW0KUhuwPRwwmEzoLi7Rqs6w9e9OweTecMCD3R3Gep9iXw/RLuFsv51aqkyC5MaQiuT5+JCv/ujRabZZyDLma7qWnx8c8HQ0pD8Z64uRNGvdYSKsMAdNKVfB2WsXS6kvGRJQku3RgO1R7EFzW7HwWHXxSA3gU/XCxFwJDcyNAbbpiKh+bfv0DxJXWt7fKj70iwkXxtwaoJiGwAc74V5Zxf28RHUMD0sNvEQRUPFuN37r9L9NeSElzoywyUj5OfBkqiKKm5A6BFInIRWbYCbeohT8xOwdjDKfiMTzyR1jqqoQW+JCM+M/oQ0MxVFidYQAAAAASUVORK5CYII=') no-repeat`
  }
}

const AlertTemplate = ({ message, options, style, close }) => (
  <div style={Object.assign({}, alertStyle, style)}>
    <div style={contentWrapperStyle}>
      <div style={iconPlaceholderStyle}>
        <div style={{ width: 32, height: 32, background: getIcon(options.type) }} />
      </div>
      <div style={messageStyle}>{message}</div>
    </div>
    <div
      onClick={close}
      style={closeButtonStyle}
    >
      <svg fill='white' xmlns='http://www.w3.org/2000/svg' height='25' width='25' viewBox='0 0 48 48'>
        <path d='M38 12.83l-2.83-2.83-11.17 11.17-11.17-11.17-2.83 2.83 11.17 11.17-11.17 11.17 2.83 2.83 11.17-11.17 11.17 11.17 2.83-2.83-11.17-11.17z' />
        <path d='M0 0h48v48h-48z' fill='none' />
      </svg>
    </div>
  </div>
)

export default AlertTemplate