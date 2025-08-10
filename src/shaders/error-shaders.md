1. Start with this working shader (should compile successfully):

```ts
@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, 0.5);
    return vec4<f32>(color, 1.0);
}
```

2. Test syntax error (missing parenthesis):
```ts
@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, 0.5;  // Missing closing parenthesis
    return vec4<f32>(color, 1.0);
}
```

3. Test type error (vec4 assigned to vec3):
```ts
@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color: vec3<f32> = vec4<f32>(uv.x, uv.y, 0.5, 1.0);  // Type mismatch
    return vec4<f32>(color, 1.0);
}
```

4. Test undefined variable:
```ts
@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, undefinedVariable);  // Undefined variable
    return vec4<f32>(color, 1.0);
}
```

5. Test multiple errors:
```ts
@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, 0.5;  // Error 1: Missing parenthesis
    let wrongType: f32 = vec3<f32>(1.0, 0.0, 0.0);  // Error 2: Type mismatch
    return vec4<f32>(undefinedVar, 1.0);  // Error 3: Undefined variable
}
```

6. Beautiful working example (animated rings):
```ts
@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = (coord.xy - 0.5 * iResolution.xy) / iResolution.y;
    let time = iTime * 2.0;

    let angle = atan2(uv.y, uv.x) + time;
    let radius = length(uv);
    let rings = sin(radius * 20.0 - time * 5.0) * 0.5 + 0.5;

    let r = sin(angle * 3.0 + time) * 0.5 + 0.5;
    let g = sin(angle * 3.0 + time + 2.094) * 0.5 + 0.5;
    let b = sin(angle * 3.0 + time + 4.188) * 0.5 + 0.5;

    let color = vec3<f32>(r, g, b) * rings;
    return vec4<f32>(color, 1.0);
}
```