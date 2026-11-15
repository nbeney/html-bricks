/* HTML Blocks examples: window.HTMLB_EXAMPLES = { 'Group': [ {title, code}, ... ], ... }
   The Examples menu builds itself from this object (one sub-menu per group).
   Each `code` is a complete, well-indented HTML document (2-space indent,
   double-quoted attributes, no inline style attributes) that round-trips
   cleanly through the parse/serialise pipeline. */
window.HTMLB_EXAMPLES = {
  'Basics': [
    {
      title: 'Hello page',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My First Page</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Hello, world!</h1>
    <p>This is my very first web page. 🎉</p>
  </body>
</html>`
    },
    {
      title: 'All about me',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>All About Me</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>All About Me</h1>
    <h2>My name is Sam</h2>
    <p>I am learning to build web pages.</p>
    <p>My favourite colour is blue.</p>
    <p>My favourite animal is a cat.</p>
    <p>
      I can write
      <strong>bold</strong>
      and
      <em>italic</em>
      words.
    </p>
  </body>
</html>`
    }
  ],
  'Text': [
    {
      title: 'Headings and paragraphs',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>Headings</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Big Heading</h1>
    <h2>Smaller Heading</h2>
    <h3>Even Smaller</h3>
    <p>A paragraph is a block of text.</p>
    <p>
      You can have
      <strong>bold</strong>
      and
      <em>italic</em>
      words.
    </p>
  </body>
</html>`
    },
    {
      title: 'A short poem',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Poem</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Stars</h1>
    <p>Twinkle twinkle little star</p>
    <p>How I wonder what you are</p>
    <hr>
    <p>Up above the world so high</p>
    <p>Like a diamond in the sky</p>
  </body>
</html>`
    }
  ],
  'Lists & Links': [
    {
      title: 'Shopping list',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>Shopping List</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Shopping List</h1>
    <ul>
      <li>Apples</li>
      <li>Bread</li>
      <li>Milk</li>
      <li>Honey</li>
    </ul>
  </body>
</html>`
    },
    {
      title: 'Top 3 games',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Top 3 Games</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>My Top 3 Games</h1>
    <ol>
      <li>Hide and seek</li>
      <li>Tag</li>
      <li>Chess</li>
    </ol>
  </body>
</html>`
    },
    {
      title: 'Links to websites',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>Fun Links</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Websites I Like</h1>
    <p>Click a link to visit a website.</p>
    <ul>
      <li>
        <a href="https://example.com">Example</a>
      </li>
      <li>
        <a href="https://example.org">Another Example</a>
      </li>
    </ul>
  </body>
</html>`
    }
  ],
  'Images & Media': [
    {
      title: 'A picture',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Picture</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Look at this!</h1>
    <img src="https://picsum.photos/400/300" alt="A random photo">
    <p>Pictures make a page fun.</p>
  </body>
</html>`
    },
    {
      title: 'Play a video',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Video</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Watch This</h1>
    <video src="movie.mp4"></video>
    <p>Press play to start the video.</p>
  </body>
</html>`
    }
  ],
  'Forms': [
    {
      title: 'Ask a question',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>Question Form</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>What is your name?</h1>
    <form>
      <label>Your name</label>
      <input type="text" name="name">
      <button type="submit">Send</button>
    </form>
  </body>
</html>`
    },
    {
      title: 'Pick a favourite',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>Favourite Fruit</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Pick your favourite fruit</h1>
    <form>
      <label>Fruit</label>
      <select>
        <option>Apple</option>
        <option>Banana</option>
        <option>Cherry</option>
      </select>
      <button type="submit">Choose</button>
    </form>
  </body>
</html>`
    }
  ],
  'Tables': [
    {
      title: 'A simple table',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Table</title>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Pets</h1>
    <table>
      <tr>
        <th>Name</th>
        <th>Animal</th>
      </tr>
      <tr>
        <td>Rex</td>
        <td>Dog</td>
      </tr>
      <tr>
        <td>Whiskers</td>
        <td>Cat</td>
      </tr>
    </table>
  </body>
</html>`
    }
  ],
  'Layout': [
    {
      title: 'Page with sections',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
    <meta charset="utf-8">
  </head>
  <body>
    <header>
      <h1>My Website</h1>
    </header>
    <section>
      <h2>Welcome</h2>
      <p>Thanks for visiting my page.</p>
    </section>
    <article>
      <h2>News</h2>
      <p>Today I learned about HTML sections.</p>
    </article>
    <footer>
      <p>Made by Sam</p>
    </footer>
  </body>
</html>`
    },
    {
      title: 'Boxes with a divider',
      code: `<!DOCTYPE html>
<html>
  <head>
    <title>Boxes</title>
    <meta charset="utf-8">
  </head>
  <body>
    <div>
      <h2>First Box</h2>
      <p>Some words go here.</p>
    </div>
    <hr>
    <div>
      <h2>Second Box</h2>
      <p>More words go here.</p>
    </div>
  </body>
</html>`
    }
  ]
};
