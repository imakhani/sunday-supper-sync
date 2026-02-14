export const FAMILIES = [
  { id: 'f1', name: 'Imran & Rachana',  emoji: '🌙', color: '#c17f5e' },
  { id: 'f2', name: 'Rahul & Leena',    emoji: '🌸', color: '#7a9e7e' },
  { id: 'f3', name: 'Iqbal & Zarpheen', emoji: '⭐', color: '#8b6f9e' },
]

export const HOST_ROTATION = ['f1', 'f2', 'f3']

export const CURATED_MEALS = [
  { name:'Build-Your-Own Taco Bar',       emoji:'🌮', kidScore:5, prepTime:'45 min',       diff:'Easy',     desc:'Ground beef, chicken, black beans. Kids love assembling their own. Keep toppings mild & separate.', kidTip:'Let toddlers fill their own soft mini tortillas. Plain beans + shredded cheese always wins.',                            tags:['crowd-pleaser','customisable','hands-on'] },
  { name:'Pasta Bar — 3 Sauces',          emoji:'🍝', kidScore:5, prepTime:'35 min',       diff:'Easy',     desc:'Marinara, butter+parm, pesto. Tiny pasta shapes for little ones. Nearly zero stress.',              kidTip:'Serve ditali or small shells — easier for 1–3 year olds. Plain butter pasta = guaranteed clean plate.',               tags:['kid-staple','vegetarian-option','easy'] },
  { name:'Sheet-Pan Chicken & Veg',       emoji:'🍗', kidScore:4, prepTime:'1 hr',         diff:'Easy',     desc:'Roast chicken thighs with carrots, potatoes, zucchini. Mild seasoning, one pan, minimal cleanup.',  kidTip:'Cut veg extra small and cook until very tender. Kids can pick their favourites.',                                       tags:['one-pan','allergen-friendly','wholesome'] },
  { name:'Homemade Pizza Night',          emoji:'🍕', kidScore:5, prepTime:'90 min',       diff:'Medium',   desc:'Store-bought dough, kids decorate their own mini pizzas. Adults get gourmet toppings on the side.', kidTip:'Give each kid a dough ball — pressing it flat is half the fun. Plain cheese mini pizzas are perfect.',                  tags:['activity','crowd-pleaser','fun'] },
  { name:'Slow-Cooker BBQ Pulled Pork',   emoji:'🥩', kidScore:4, prepTime:'15 min active',diff:'Easy',     desc:'Set it in the morning. Soft slider buns perfect for toddler-sized portions.',                       kidTip:'Shred pork very fine. Soft brioche slider buns are easy for little hands and mouths.',                                 tags:['make-ahead','crowd-pleaser'] },
  { name:'Mac & Cheese (Two Ways)',       emoji:'🧀', kidScore:5, prepTime:'40 min',       diff:'Easy',     desc:'Classic stovetop for kids. Stir in fancy cheese, bacon, truffle oil for adults. Everyone wins.',    kidTip:'Make kid version first, scoop out, then elevate the pot for adults. No complaints guaranteed.',                          tags:['kid-staple','comfort','two-versions'] },
  { name:'Grilled Salmon + Rice',         emoji:'🐟', kidScore:3, prepTime:'40 min',       diff:'Medium',   desc:'Flaky baked salmon with plain rice for kids. Light, healthy and impressive for adults.',             kidTip:'Flake salmon thoroughly — check for bones. Plain rice with a little butter is very toddler-friendly.',                  tags:['healthy','omega-3'] },
  { name:'Meatball Sub Bar',             emoji:'🥖', kidScore:5, prepTime:'50 min',       diff:'Medium',   desc:'Bake meatballs ahead. Soft rolls, marinara, melted mozzarella. Kids do mini versions.',              kidTip:'Small meatballs cut in half avoid choking risk. Soft rolls help too.',                                                  tags:['make-ahead','crowd-pleaser','fun'] },
  { name:'Chicken Quesadillas + Guac',    emoji:'🫔', kidScore:5, prepTime:'30 min',       diff:'Easy',     desc:'Quick to make in batches. Cut into small triangles for little hands.',                               kidTip:'Cut into thin triangles. Quesadillas are ideal finger food for toddlers — they love the crunch.',                      tags:['quick','kid-staple','customisable'] },
  { name:'Mild Chili + Cornbread',        emoji:'🫕', kidScore:4, prepTime:'1 hr',         diff:'Easy',     desc:'Mild chili base — adults spice their own bowl. Cornbread is loved by all ages.',                    kidTip:'Keep the base totally mild. Adults can add hot sauce. Cornbread squares are great for little hands.',                   tags:['comfort','make-ahead','warming'] },
  { name:'Lo Mein Noodle Night',          emoji:'🥢', kidScore:4, prepTime:'35 min',       diff:'Easy',     desc:'Noodles with chicken, broccoli, carrots. Plain noodles with butter for picky eaters.',              kidTip:'Set aside plain noodles with sesame oil before adding sauces. Kids love slurping noodles!',                             tags:['quick','veggie-packed','fun'] },
  { name:'Backyard Burgers',              emoji:'🍔', kidScore:5, prepTime:'45 min',       diff:'Easy',     desc:'Classic grill night. Smash burgers for adults, simple patties for kids.',                           kidTip:'Make slider-sized patties for little ones. Soft buns are key at age 1–3.',                                              tags:['grill','crowd-pleaser'] },
  { name:'Chicken Soup + Crusty Bread',   emoji:'🍲', kidScore:4, prepTime:'90 min',       diff:'Medium',   desc:'Hearty and comforting. Kids love the noodles, adults love the depth.',                              kidTip:'Chop veg fine for toddlers. Soft noodles in broth = toddler heaven.',                                                  tags:['comfort','make-ahead','warming'] },
  { name:'Baked Fish Tacos with Slaw',    emoji:'🐠', kidScore:3, prepTime:'45 min',       diff:'Medium',   desc:'Crispy baked fish, mild slaw, crema. Kids get plain fish in a soft tortilla.',                     kidTip:'Bake not fry. Remove skin & bones. Plain fish in a soft wrap works great.',                                            tags:['healthy','customisable'] },
  { name:'Sunday Roast Chicken',          emoji:'🐔', kidScore:4, prepTime:'2 hr',         diff:'Involved', desc:'Whole roasted chicken, roasted potatoes and veg. Classic and impressive.',                          kidTip:'Drumsticks are fun for older kids. Shred thigh meat for 1–2 year olds. Soft roast carrots are a hit.',                 tags:['special-occasion','impressive','traditional'] },
]

export const TAG_COLORS = {
  'crowd-pleaser':'#c17f5e','kid-staple':'#7a9e7e','easy':'#5e8bc1','quick':'#5e8bc1',
  'make-ahead':'#8b6f9e','comfort':'#b85c5c','fun':'#c4956a','healthy':'#7a9e7e',
  'one-pan':'#5e9e9e','grill':'#c17f5e','special-occasion':'#8b6f9e','activity':'#c4956a',
  'vegetarian-option':'#7a9e7e','allergen-friendly':'#5e9e9e','warming':'#b85c5c',
  'veggie-packed':'#7a9e7e','customisable':'#c4956a','two-versions':'#8b6f9e',
  'wholesome':'#7a9e7e','hands-on':'#c4956a','impressive':'#8b6f9e',
  'traditional':'#b85c5c','omega-3':'#5e9e9e',
}

export function getSundays(monthsAhead = 3) {
  const out = [], today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setMonth(end.getMonth() + monthsAhead)
  let d = new Date(today)
  d.setDate(d.getDate() + (d.getDay() === 0 ? 0 : 7 - d.getDay()))
  while (d <= end) { out.push(new Date(d)); d.setDate(d.getDate() + 7) }
  return out
}

export const fmtDate  = d => d.toLocaleDateString('en-US', { weekday:'long',  month:'long', day:'numeric', year:'numeric' })
export const fmtShort = d => d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
export const dateKey  = d => d.toISOString().split('T')[0]
