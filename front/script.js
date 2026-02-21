const BASE = "/api";

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const secToMin = (seconds) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mm}:${ss}`;
};

const routes = document.querySelectorAll("section[data-role]");

const navs = document.querySelectorAll("nav[data-role]");
function handleUserNav(user) {
  for (const nav of navs) {
    if (nav.dataset.role === user) {
      nav.classList.add("ativo");
    } else {
      nav.classList.remove("ativo");
    }
  }
}

let user;
async function getUser() {
  user = "public";
  try {
    const response = await fetch(BASE + "/auth/session");
    if (!response.ok) {
      throw new Error();
    }
    const response_body = await response.json();
    user = response_body.role;
    return user;
  } catch (error) {
    return user;
  } finally {
    handleUserNav(user);
  }
}

async function router() {
  if (!user) {
    user = await getUser();
  }

  const r = location.hash.replace("#", "").split("/").filter(Boolean).shift();
  const route = document.getElementById(r);
  routes.forEach((item) => item.classList.remove("ativo"));
  if (route) {
    if (user !== route.dataset.role) location.hash = "/login";
    route.classList.add("ativo");
    if (typeof data[r] === "function") data[r](route);
  } else {
    if (typeof data[r] === "function") data[r]();
  }
}
window.addEventListener("DOMContentLoaded", router);
window.addEventListener("hashchange", router);

async function getData(url, callback) {
  const response = await fetch(BASE + url);
  const body = await response.json();
  callback(body, response);
}

function renderResetCourseButton(courseId) {
  setTimeout(() => {
    sendForm("DELETE", "/lms/course/reset", "resetar-curso", () => {
      location.reload();
    });
  }, 50);

  return /*html*/ `
          <div id="resetar-curso">
            <form>
              <input name="courseId" type="hidden" value="${escape(courseId)}">
              <button>Resetar</button>
            </form>
          </div>
        `;
}

function renderCompleteButton(courseId, lessonId) {
  setTimeout(() => {
    sendForm("POST", "/lms/lesson/complete", "completar", () => {
      document.getElementById("completar").innerHTML = "<span></span>";
    });
  }, 50);

  return /*html*/ `
          <div id="completar">
            <form>
              <input name="courseId" type="hidden" value="${escape(courseId)}">
              <input name="lessonId" type="hidden" value="${escape(lessonId)}">
              <button>Completar</button>
            </form>
          </div>
        `;
}

const data = {
  cursos: (route) => {
    getData("/lms/courses", (courses) => {
      const render = route.querySelector(".render");
      render.innerHTML = "";
      let html = "";
      for (const course of courses) {
        html += /*html*/ `
                <div class="curso-item">
                  <h2>${escape(course.title)}</h2>
                  <p>${escape(course.description)}</p>
                  <span>Aulas: ${escape(course.lessons)}</span>
                  <span>Horas: ${escape(course.hours)}</span>
                  <a class="btn" href="#/curso/${escape(course.slug)}">${escape(course.title)}</a>
                </div>
              `;
      }
      render.innerHTML = html;
    });
  },

  curso: (route) => {
    const [_, curso] = location.hash
      .replace("#", "")
      .split("/")
      .filter(Boolean);
    if (!curso) return;
    getData(`/lms/course/${curso}`, (data) => {
      const { course, lessons, completed } = data;
      const render = route.querySelector(".render");
      render.innerHTML = "";
      let html = /*html*/ `
                <div class="curso-item">
                  <h2>${escape(course.title)}</h2>
                  <p>${escape(course.description)}</p>
                  <span>Aulas: ${escape(course.lessons)}</span>
                  <span>Horas: ${escape(course.hours)}</span>
                </div>
              `;
      html += '<ul class="curso-aulas">';
      for (const lesson of lessons) {
        const isCompleted = completed.some(
          (value) => value.lesson_id == lesson.id,
        );

        html += /*html*/ `
                <li>
                  <a href="#/aula/${escape(course.slug)}/${escape(lesson.slug)}">
                    ${escape(lesson.title)}
                    <span>
                      <span>
                        ${escape(secToMin(lesson.seconds))}
                      </span>
                      <span class="status ${isCompleted ? "completa" : ""}">
                      </span>
                    </span>
                  </a>
                </li>
              `;
      }
      html += `</ul>
              ${completed.length > 0 ? renderResetCourseButton(course.id) : ""}
            `;

      render.innerHTML = html;
    });
  },

  aula: (route) => {
    const [_, curso, aula] = location.hash
      .replaceAll("#", "")
      .split("/")
      .filter(Boolean);

    if (!curso || !aula) return;
    getData(`/lms/lesson/${curso}/${aula}`, (lesson) => {
      const render = route.querySelector(".render");
      render.innerHTML = "";
      let html = /*html*/ `
              <div>
                <h2>${escape(lesson.title)}</h2>
                <div id="breadcrumb">
                  <a href="#/cursos">cursos</a> >
                  <a href="#/curso/${curso}">${curso}</a>
                </div>
                <div id="video">
                  <video poster="" preload="metadata" src="${lesson.video}" controls></video>
                </div>
                <nav id="aula-nav">
                  ${
                    lesson.indexPrev
                      ? `<a class="btn" href="${escape(`#/aula/${curso}/${lesson.indexPrev}`)}">Anterior</a>`
                      : `<span></span>`
                  }

                  ${
                    lesson.completed
                      ? `<span></span>`
                      : renderCompleteButton(lesson.course_id, lesson.id)
                  }

                  ${
                    lesson.indexNext
                      ? `<a class="btn" href="${escape(`#/aula/${curso}/${lesson.indexNext}`)}">Proxima</a>`
                      : `<span></span>`
                  }
                </nav>
              </div>
            `;
      render.innerHTML = html;
    });
  },

  certificados: (route) => {
    getData("/lms/certificates", (certificates) => {
      if (!Array.isArray(certificates)) {
        return;
      }
      const render = route.querySelector(".render");
      render.innerHTML = "";
      let html = `<ul>`;
      for (const certificate of certificates) {
        html += /*html*/ `
                <li>
                  <a class="btn" target="_blank" href="/api/lms/certificate/${certificate.id}">${escape(certificate.title)}
                    <span>${certificate.completed.slice(0, 10).split("-").reverse().join("/")}
                    </span>
                  </a>
                </li>
              `;
      }
      html += "</ul>";
      render.innerHTML = html;
    });
  },

  sair: async () => {
    await fetch(BASE + "/auth/logout", {
      method: "DELETE",
    });
    user = "public";
    location.hash = "/login";
    handleUserNav(user);
  },

  resetar: () => {
    const query = location.hash.split("=");
    if (query[1]) {
      const token = document.querySelector('input[name="token"]');
      if (token) {
        token.value = query[1];
      }
    }
  },

  ["criar-curso"]: async (route) => {
    getData("/lms/courses", (courses) => {
      const render = route.querySelector(".render");
      const form = route.querySelector("form");

      render.innerHTML = "";

      const select = document.createElement("select");

      select.name = "courses-select";
      select.add(new Option("Selecionar Curso", null));

      let index = 0;

      for (const course of courses) {
        select.add(new Option(course.slug, index));
        index++;
      }

      select.addEventListener("change", (e) => {
        e.preventDefault();
        const course = courses[select.value];
        for (const key in course) {
          const input = form.querySelector(`[name=${key}]`);
          if (input) {
            input.value = course[key];
          }
        }
      });

      render.append(select);
    });
  },

  ["criar-aula"]: (route) => {
    getData("/lms/lessons", (lessons) => {
      const render = route.querySelector(".render");
      const form = route.querySelector("form");
      render.innerHTML = "";
      const select = document.createElement("select");
      select.name = "lessons-select";
      let index = 0;
      select.add(new Option("Selecione a aula", null));
      for (const lesson of lessons) {
        select.add(new Option(`${lesson.courseSlug} - ${lesson.slug}`, index));
        index++;
      }

      select.addEventListener("change", (e) => {
        e.preventDefault();
        const lesson = lessons[select.value];
        for (const key in lesson) {
          const input = form.querySelector(`[name=${key}]`);
          if (input) {
            input.value = lesson[key];
          }
        }
      });

      render.append(select);
    });
  },

  usuarios: (route) => {
    const render = route.querySelector(".render");
    getData("/auth/users/search", (users, response) => {
      const total = Number(response.headers.get("x-total-count"));
      renderUsers(users, total, render);
    });

    const form = document.querySelector("#usuarios form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      getData(
        `/auth/users/search?search=${data.get("search")}&page=${data.get("page")}`,
        (users, response) => {
          const total = Number(response.headers.get("x-total-count"));
          renderUsers(users, total, render);
        },
      );
    });
  },
};

function renderUsers(users, total, render) {
  let html = "<ul>";
  const pages = document.createElement("nav");
  const total_pages = Math.ceil(total / 5);
  const form = document.querySelector("#usuarios form");
  const page = document.getElementById("page");

  render.innerHTML = "";
  pages.id = "pages";

  if (total_pages > 1) {
    for (let i = 1; i <= total_pages; i++) {
      const button = document.createElement("button");
      button.innerText = 1;
      button.addEventListener("click", (e) => {
        page.value = i;
        form.requestSubmit();
      });
      pages.append(button);
    }
  }

  for (const user of users) {
    html += /*html*/ `
            <li>
              <span>${escape(user.name)}</span>
              <span>${escape(user.email)}</span>
            </li>
          `;
  }
  html += "</ul>";
  render.innerHTML = html;
  render.append(pages);
}

async function sendForm(method, url, id, callback) {
  const form = document.querySelector("#" + id + " form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    let response;
    let body = {};
    const badge = document.createElement("div");
    try {
      response = await fetch(BASE + url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      body = await response.json();
      if (!response.ok) throw new Error();
      if (typeof callback === "function") callback(response, body);
      badge.innerText = `${response.status}`;
      badge.classList.add("ok");
    } catch (error) {
      badge.innerText = `${response.status} - ${body?.title}`;
      badge.classList.add("fail");
    } finally {
      form.append(badge);
      setTimeout(() => {
        badge?.remove();
      }, 1500);
    }
  });
}

sendForm("POST", "/auth/login", "login", async () => {
  user = await getUser();
  if (user === "user") location.hash = "/cursos";
  if (user === "admin") location.hash = "/criar-curso";
});

sendForm("POST", "/auth/user", "criar-conta", () => {
  location.hash = "/login";
});

sendForm("POST", "/auth/password/forgot", "perdeu");

sendForm("POST", "/lms/course", "criar-curso");

const lessonsForm = document.querySelector("#criar-aula form");
lessonsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = new FormData(lessonsForm);

    const input = lessonsForm.querySelector('input[type="file"]');

    if (input && input.files && input.files.length !== 0) {
      const files = input.files;
      const responseFile = await fetch(BASE + "/files/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-filename": files[0].name,
          "x-visibility": data.get("free") === "1" ? "public" : "private",
        },
        body: files[0],
      });
      if (!responseFile.ok) throw new Error();
      const upload = await responseFile.json();
      data.set("video", upload.path);
    }

    const responseLesson = await fetch(BASE + "/lms/lesson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(data)),
    });

    if (responseLesson.ok) location.reload();
  } catch (error) {
    console.log(error);
  }
});
